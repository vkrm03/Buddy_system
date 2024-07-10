const express = require("express");
const bodyParser = require("body-parser");
const pg = require("pg");
const bcrypt = require('bcrypt');


const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Mentor-mentee",
  password: "vkrm123",
  port: 5432
});
db.connect();

const app = express();
const port = 3000;

let currnt_Id, currnt_image_url;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

function checkAuth(req, res, next) {
    if (currnt_Id) {
        next();
    } else {
        res.redirect("/login?error=Please log in first");
    }
}


app.get("/", async (req, res) => {
    res.render("home.ejs");
});

app.get("/about", async (req, res) => {
    res.render("about.ejs");
});

app.get("/student-mentees", async (req, res) => {
    const result = await db.query('SELECT * FROM mentor_student_information');
    data = result.rows
    res.render("student-mentees-15.ejs", {datas:data});
});

app.get("/login", async (req, res) => {
    const error = req.query.error;
    const success = req.query.success;
    const logout = req.query.logout;
    res.render("login.ejs", { error, success, logout });
});

app.get("/logout", (req, res) => {
    currnt_Id = null;
    currnt_image_url = null;
    res.redirect("/login?logout=true");
});


app.post("/login", async (req, res) => {
    const role = req.body.role
    const email = req.body.email
    const pass = req.body.pass
    try {
        const result = await db.query('SELECT * FROM staff_information WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            currnt_Id = user.id
            if (currnt_Id == 1) {
                currnt_image_url = "/A1_staff.jpg"
            } else if (currnt_Id == 2) {
                currnt_image_url = "/A2_staff.jpg"
            }
            else if (currnt_Id == 3) {
                currnt_image_url = "/A3_staff.jpg"
            }
            else if (currnt_Id == 4) {
                currnt_image_url = "/A4_staff.jpg"
            }else  {
                currnt_image_url = "/A5_staff.jpg"
            }
            if (user.passwords == pass) {
                res.redirect("/dashboard?userId=" + currnt_Id + "&success=true");
            } else {
                res.redirect("/login?error=Invalid password");
            }
        } else {
            res.redirect("/login?error=User Not Found");
        }
    } catch (err) {
        console.error(err);
        res.redirect("/login?error=An error occurred");
    }
});


app.get("/dashboard",checkAuth, async (req, res) => {
    const result = await db.query('SELECT * FROM staff_information WHERE id = $1', [currnt_Id]);
    if (result.rows.length > 0) {
        const user = result.rows[0];
        const success = req.query.success;
        res.render("index.ejs", {
            StaffName: user.name,   
            StaffEmail: user.email,
            StaffGender: user.gender,
            StaffMobileNum: user.mobile_no,
            StaffHandling: user.handlings,
            StaffHandlingSeniorName: user.handling_senior_names,
            image_url: currnt_image_url,
            success : success
        });
    } else {
        res.redirect("/login?error=User not found");
    }
});

app.get("/odop",checkAuth, async (req, res) => {
    const staff = await db.query('SELECT * FROM staff_information WHERE id = $1', [currnt_Id]);
    staff_name = staff.rows[0].name
    res.render("odop.ejs", {StaffName:staff_name, image_url: currnt_image_url});
});

app.get("/edit-student",checkAuth, async (req, res) => {
    const staff = await db.query('SELECT * FROM staff_information WHERE id = $1', [currnt_Id]);
    staff_name = staff.rows[0].name
    const result = await db.query('SELECT * FROM mentor_student_information WHERE staff_id = $1', [currnt_Id]);
    student1 = result.rows[0]
    student2 = result.rows[1]
    student3 = result.rows[2]
    res.render("edit-student-data.ejs", {StaffName:staff_name,student_1:student1,student_2:student2,student_3:student3,image_url: currnt_image_url});
});
app.get("/edit-student/Edit",checkAuth, async (req, res) => {
    const staff = await db.query('SELECT * FROM staff_information WHERE id = $1', [currnt_Id]);
    staff_name = staff.rows[0].name
    res.render("edit-particular-student.ejs", {StaffName:staff_name,image_url: currnt_image_url});
});

app.get("/student-stats",checkAuth, async (req, res) => {
    const staff = await db.query('SELECT * FROM staff_information WHERE id = $1', [currnt_Id]);
    const std_data = await db.query('SELECT * FROM student_marks WHERE staff_id = $1 ORDER BY reg_no', [currnt_Id]);
    const std_datas = std_data.rows
    staff_name = staff.rows[0].name
    res.render("student_stats.ejs", {StaffName:staff_name,image_url: currnt_image_url,student_data:std_datas});
});

app.get("/student-stats/info",checkAuth, async (req, res) => {
    const staff = await db.query('SELECT * FROM staff_information WHERE id = $1', [currnt_Id]);
    staff_name = staff.rows[0].name
    particular_std_id = req.query.std_id
    const particular_info = await db.query('SELECT * FROM student_marks WHERE reg_no = $1', [particular_std_id]);
    res.render("particular_under_student_info.ejs", {StaffName:staff_name,image_url: currnt_image_url,full_data:particular_info.rows[0]});
});

app.get("/student-data/info",checkAuth, async (req, res) => {
    const staff = await db.query('SELECT * FROM staff_information WHERE id = $1', [currnt_Id]);
    staff_name = staff.rows[0].name
    std_id = req.query.std_id
    const twenty_std = await db.query('SELECT * FROM student_marks WHERE mentee_id = $1 ORDER BY reg_no', [std_id]);
    res.render("under_student_info.ejs", {StaffName:staff_name,image_url: currnt_image_url,under_twenty_std:twenty_std.rows});
});



app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
  