const express = require("express");
const app = express();
const port = 3000;

const pool = require("./config/database");
const Joi = require("joi");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const dateSchema = Joi.object({
  start_date: Joi.date().required().max(Joi.ref("end_date")),
  end_date: Joi.date().required(),
  // start_date: Joi.date().required(),
  // end_date: Joi.date().required().when('start_date', {
  //     is: Joi.date().required(),
  //     then: Joi.date().min(Joi.ref("start_date")).required()
  // }),
});

const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  due_date: Joi.date().required(),
});
app.get("/todo", async (req, res, next) => {
  const start_date = req.query.start_date;
  const end_date = req.query.end_date;
  const conn = await pool.getConnection();
  // const [result_todo] = await pool.query("SELECT *, DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date FROM todo");
  // res.status(200).send(result_todo);
  try {
    let resultDateJoi = dateSchema.validate(req.query, { abortEarly: false });
    if (resultDateJoi.error) {
      // throw resultDateJoi.error;
      const [rows, fields] = await pool.query(
        "SELECT *, DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date FROM todo"
      );
      res.status(200).json(rows);
    } else {
      const [rows, fields] = await pool.query(
        "SELECT *, DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date FROM todo WHERE due_date between ? and ?",
        [start_date, end_date]
      );
      res.status(200).json(rows);
    }
  } catch (err) {
    console.log(err);
    next(err);
  } finally {
    conn.release();
  }
  // res.send("GET ToDo List");
});

app.post("/todo", async (req, res, next) => {
  let title = req.body.title;
  let description = req.body.description;
  let due_date = req.body.due_date;

  // let resultCreateJoi = createSchema.validate(req.body, { abortEarly: false })

  // if (resultCreateJoi.errors){
  //     res.status(400).send({"message": 'ต้องกรอก description'})
  // }
  // else {
  //     res.send()
  // }
  let [result_insert] = await pool.query(
    "select max(todo.id) as `id`, max(todo.order) as `order` from todo"
  );
  
  result_insert = result_insert[0];
  let order = result_insert.order + 1;
  let id = result_insert.id + 1;
  console.log(result_insert);
  if (description.length == 0) {
    res.status(400).send({ message: "ต้องกรอก description" });
  } else if (title.length == 0) {
    res.status(400).send({ message: "ต้องกรอก title" });
  } else {
    let result_insert = await pool.query(
      "insert into todo(title, description, due_date, `order`) values(?,?,?,?)",
      [title, description, due_date, order]
    );
    console.log(`สร้าง ToDo '${title}' สำเร็จ`);
    res.status(201).send({
      message: `สร้าง ToDo '${title}' สำเร็จ`,
      todo: {
        title: title,
        description: description,
        due_date: due_date,
        id: id,
        order: order,
      },
    });
  }
  //   res.send("POST create a new ToDo");
});

app.get("/todo/:id", async (req, res, next) => {
  // let start_date = new Date(req.query.start_date)
  try {
    const [rows, fields] = await pool.query(
      "SELECT *, DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date FROM todo WHERE id=?",
      [req.params.id]
    );
    res.status(200).send(rows[0]);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

app.delete("/todo/:id", async (req, res, next) => {
  const conn = await pool.getConnection();
  let id = req.params.id;
  // Begin transaction
  await conn.beginTransaction();
  let [results_id] = await conn.query("select * from todo where id=?", [id]);
  console.log("result id ", results_id);

  try {
    // console.log(req.body,id);
    // console.log(req.query.id);
    let [results_del] = await conn.query("delete from todo where id=?", [id]);
    if (results_del.affectedRows === 1) {
      conn.commit();
      console.log("result del ", results_del);
      res
        .status(200)
        .send({ message: `ลบ ToDo '${results_id[0].title}' สำเร็จ` });
    } else {
      throw "Cannot delete the selected blog";
    }

    // res.send(`DELETE a ToDo with id = ${req.params.id}`);
  } catch (err) {
    console.log(err);
    await conn.rollback();
    return res.status(404).send({ message: "ไม่พบ ToDo ที่ต้องการลบ" });
  } finally {
    console.log("finally del");
    conn.release();
  }
});

module.exports = app;
