const express = require('express')
const app = express()
const port = 3000

const pool = require("./config/database")

app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.get('/todo', async (req, res, next) => {
  const start_date = req.query.start_date
  const end_date = req.query.end_date
  try {
    const [rows, fields] = await pool.query("SELECT *, DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date FROM todo WHERE due_date between ? and ?", [
      start_date,
      end_date,
    ])
    res.json(rows)
  } catch (err) {
    console.log(err)
    next(err)
  }
  // res.send('GET ToDo List')
})

app.post('/todo', async (req, res, next) => {
  const conn = await pool.getConnection();
  // Begin transaction
  await conn.beginTransaction();
  const title = req.body.title;
    const description = req.body.description;
    const due_date = req.body.due_date;
  try {
    console.log(req.body)
    //if else validate here
    if (title.length <= 0 ){
      res.status(400).json(
        {
        "message": "ต้องกรอก title"
      }
      )
    }
    if (description.length <=0 ){
      res.status(400).json(
        {
        "message": "ต้องกรอก description"
      }
      )
    }
    
    let order = await conn.query(
      "select max('order'), DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date from todo"
    );
    console.log("order" , order[0])
      let results = await conn.query(
        "INSERT INTO todo(title, description, due_date) VALUES(?, ?, CURRENT_TIMESTAMP);",
        [title, description, due_date, order[0]]
      );
      const todoId = results[0].insertId;
      console.log(results)
      await conn.commit();
      res.status(201).json(
        {
          "message": "สร้าง ToDo '"+ title+"' สำเร็จ",
          "todo": {
            "id": 1,
            "title": ""+ title+"",
            "description": ""+ description+"",
            "due_date": ""+ due_date +"",
            "order": order
          }
        }
      );
    } catch (err) {
      await conn.rollback();
      return res.status(400).json(err.toString());
    } finally {
      console.log("finally");
      conn.release();
    }
  // res.send('POST create a new ToDo')
})

app.get('/todo/:id', async (req, res, next) => {
  try {
    const [rows, fields] = await pool.query("SELECT *, DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date FROM todo WHERE id=?", [req.params.id])
    res.json(rows[0])
  } catch (err) {
    console.log(err)
    next(err)
  }
})

app.delete('/todo/:id', async (req, res, next) => {
  const conn = await pool.getConnection();
    // Begin transaction
    await conn.beginTransaction();
    try {
      const tobeDelete = await conn.query("SELECT title FROM `todo` WHERE `id` = ?", [
        req.params.id,
      ]);
      // console.log("tobeDelete" , tobeDelete[0][0].title)
    const deleted = await conn.query("DELETE FROM `todo` WHERE `id` = ?", [
      req.params.id,
    ]);
    console.log('deleted' , deleted)
    if (deleted[0].affectedRows === 1) {
      await conn.commit();
      res.status(200).json(
        {
        "message": "ลบ ToDo '"+ tobeDelete[0][0].title +"' สำเร็จ",
      }
      )
    }
    else {
      throw "Cannot delete the selected blog";
    }
    // res.send(`DELETE a ToDo with id = ${req.params.id}`)
    // console.log('deleted' , deleted)
  }
  catch (err) {
    console.log(err)
    await conn.rollback();
    return res.status(404).json(
      {
        "message": "ไม่พบ ToDo ที่ต้องการลบ"
      }
    );
  }
  finally {
    conn.release();
  }
}
)

module.exports = app