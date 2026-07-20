import express, { type Request, type Response } from "express";

// import middleware
import morgan from "morgan";

// import database
import { students } from "@db/db.js";
import { type Student, type Course } from "@libs/types.js";
import {
  zStudentDeleteBody,
  zStudentPostBody,
  zStudentPutBody,
} from "@libs/studentValidator.js";
import { success } from "zod";

const app = express();
const port = process.env.PORT || 3000;

// use middleware
app.use(morgan("dev", { immediate: false }));
app.use(express.json()); // parses request's payload into 'req.body'

// Endpoints
app.get("/api/me", (req: Request, res: Response) => {
  return res.json({
    ok: true,
    fullName: "Chanidapha Phairintharapha",
    studentId: "680610664",
  });
});

// GET /students
// get students (by program)
app.get("/students", (req: Request, res: Response) => {
  try {
    const program = req.query.program as string | undefined;
    const studentId = req.query.studentId as string | undefined;

    let filteredStudents = students;

    if (studentId) {
      filteredStudents = filteredStudents.filter(
        (student) => student.studentId === studentId,
      );
    }

    if (program) {
      filteredStudents = filteredStudents.filter(
        (student) => student.program === program,
      );
    }

    return res.json({
      ok: true,
      data: filteredStudents,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Something is wrong, please try again",
    });
  }
});

// POST /students, body = {new student data}
// add a new student
app.post("/students", (req: Request, res: Response) => {
  try {
    const body = req.body as Student;

    // validate req.body with predefined validator
    const result = zStudentPostBody.safeParse(body); // check zod
    if (!result.success) {
      return res.json({
        message: "Validation failed",
        errors: result.error.issues[0]?.message,
      });
    }

    //check duplicate studentId
    const found = students.find(
      (student) => student.studentId === body.studentId,
    );
    if (found) {
      return res.json({
        success: false,
        message: "Student is already exists",
      });
    }

    // add new student
    const new_student = body;
    students.push(new_student);

    // add response header 'Link'
    res.set("Link", `/students/${new_student.studentId}`);

    return res.json({
      success: true,
      data: new_student,
    });
    // return res.json({ ok: true, message: "successfully" });
  } catch (err) {
    return res.json({
      success: false,
      message: "Somthing is wrong, please try again",
      error: err,
    });
  }
});

// PUT /students, body = {studentId}
// Update specified student
app.put("/students", (req: Request, res: Response) => {
  try {
    const body = req.body as Student;

    // validate req.body with predefined validator
    const result = zStudentPutBody.safeParse(body); // check zod
    if (!result.success) {
      return res.json({
        message: "Validation failed",
        errors: result.error.issues[0]?.message,
      });
    }

    //check duplicate studentId
    const foundIndex = students.findIndex(
      (student) => student.studentId === body.studentId,
    );

    if (foundIndex === -1) {
      return res.json({
        success: false,
        message: "Student does not exists",
      });
    }

    // update student data
    students[foundIndex] = { ...students[foundIndex], ...body };

    // add response header 'Link'
    res.set("Link", `/students/${body.studentId}`);

    return res.json({
      success: true,
      message: `Student ${body.studentId} has been updated successfully`,
      data: students[foundIndex],
    });
  } catch (err) {
    return res.json({
      success: false,
      message: "Somthing is wrong, please try again",
      error: err,
    });
  }
});

// DELETE /students, body = {studentId}
app.delete("/students", (req: Request, res: Response) => {
  try {
    const body = req.body as Student;

    const result = zStudentDeleteBody.safeParse(body);

    if (!result.success) {
      return res.status(400).json({
        ok: false,
        message: "Student Id must contain 9 characters",
      });
    }

    const foundIndex = students.findIndex(
      (student) => student.studentId === body.studentId,
    );

    if (foundIndex === -1) {
      return res.status(404).json({
        ok: false,
        message: "Student Id not found",
      });
    }

    const deletedStudent = students.splice(foundIndex, 1);

    return res.json({
      ok: true,
      message: `Student Id ${body.studentId} has been deleted`,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

// GET /api/me

app.listen(port, async () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

export default app;
