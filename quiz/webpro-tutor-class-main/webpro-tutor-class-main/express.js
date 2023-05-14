const express = require('express');
const { end } = require('./config/database');
const app = express();

const pool = require('./config/database');
const Joi = require("joi");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/** 
 *  เริ่มทำข้อสอบได้ที่ใต้ข้อความนี้เลยครับ
 * !!! ไม่ต้องใส่ app.listen() ในไฟล์นี้นะครับ มันจะไป listen ที่ไฟล์ server.js เองครับ !!!
 * !!! ห้ามลบ module.exports = app; ออกนะครับ  ไม่งั้นระบบตรวจไม่ได้ครับ !!!
*/
const createDateSchema = Joi.object({
    start_date: Joi.date().required().max(Joi.ref('end_date')),
    end_date: Joi.date().required(),
    // start_date: Joi.date().required(),
    // end_date: Joi.date().required().when('start_date', {
    //     is: Joi.date().required(),
    //     then: Joi.date().min(Joi.ref("start_date")).required()
    // }),
  });
//   .custom((obj) => {
    // if (!(obj.end_date && obj.start_date)) {
    //   return obj;
    // }
    // else if (obj.start_date && obj.end_date) {
    //   return obj;
    // }
    // throw new Joi.ValidationError("you want to fill in start_date")
//   });
app.get("/get_todo", async (req, res)=> {
    const [data] = await pool.query("select *, DATE_FORMAT(due_date, '%Y-%m-%d') from todo")
    return res.send(data)
})

app.delete("/todo/:id", async (req,res)=> {
    const id = req.params.id
    console.log(id) 

    const [todo] = await pool.query("select * , DATE_FORMAT(due_date, '%Y-%m-%d') from todo where id =?",[id,])
    console.log("result_todo", todo);

    if (todo.length === 0){
        res.status(404).json({
            "message": "ไม่พบ ToDo ที่ต้องการลบ"
          })
    }
    // begin trasection 

    const conn = await pool.getConnection()
    await conn.beginTransaction()

    try {
        const [data] = await pool.query("delete from todo where id =?",[
            id,
        ])
        conn.commit()
        console.log(data)
        res.status(200).json({
            "message": `ลบ ToDo '${todo[0].title}' สำเร็จ`,
          })
        
    }catch {
        conn.rollback()
        res.status(404).json()
       

    }finally {
        conn.release()
    }
    // pool.query("delete from todo")
})
// query string
app.get("/todo", async (req, res)=> {
    const start_date = req.query.start_date
    const end_date = req.query.end_date
    let resultDateJoi = createDateSchema.validate(req.query, { abortEarly: false });

    console.log(resultDateJoi.value)

    if (resultDateJoi.error){
        // console.log("error", resultDateJoi.error.detail);
        return res.status(400).send(resultDateJoi)
    }
    console.log("query string", start_date, "end date", end_date)
    try {
        const [todoDateData] = await pool.query("select *, DATE_FORMAT(due_date, '%Y-%m-%d') from todo where due_date Between ? AND ?",[
        start_date,
        end_date,
    ])    
        console.log("todo by date", todoDateData)
        return res.send(todoDateData)
    }catch (err) {
        res.status(404).send(err.toString())
        console.log(err)
    }
    // try {
    //     await createDateSchema.validateAsync(req.query, { abortEarly: false });
    // const [todoDateData] = await pool.query("select *, DATE_FORMAT(due_date, '%Y-%m-%d') from todo where due_date Between ? AND ?",[
    //     start_date,
    //     end_date,
    // ])    
    //     console.log("todo by date", todoDateData)
    //     return res.send(todoDateData)
    // }catch (err) {
    //     res.status(404).send(err.toString())
    //     console.log(err)
    // }


})
module.exports = app;
