const express = require('express');
const sql = require('mssql');
const exphbs = require('express-handlebars');
const path = require('path');
const morgan = require('morgan');
const crypto = require('crypto');
const app = express();


const validateMD5 = (string, hashedString) => {
	const cmp = crypto.createHash('md5').update(string).digest("hex");
	return cmp === hashedString;
}

const sqlConfig = {
	host: "localhost",
	user: 'superadmin',
	password: 'superadmin',
	database: 'QLSinhVien',
	server: 'DESKTOP-IQK0OG7',
	pool: {
		max: 10,
		min: 0,
		idleTimeoutMillis: 30000
	},
	options: {
		encrypt: true, // for azure
		trustServerCertificate: true // change to true for local dev / self-signed certs
	}
}

app.use(morgan("dev"));
app.set('views', path.join(__dirname + "/views"));
app.use(express.static(path.join(__dirname, "../public")))
app.engine('.hbs', exphbs({
	extname: '.hbs',
	layoutsDir: __dirname + '/views/layouts',
	partialsDir: __dirname + '/views/partials'
}));
app.set('view engine', '.hbs');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());



app.get("/login", async (req, res) => {
	res.render('login', {
		layout: 'main',
		showTitle: true,
	})
})

app.post('/login', (req, res) => {
	const { body: { username, password } } = req;

	var dbConn = new sql.ConnectionPool(sqlConfig);

	dbConn.connect().then(function () {
		var request = new sql.Request(dbConn);
		request.query(`select * from sinhvien where tendn = '${username}'`).then(function (resp) {
			if (resp.recordset && resp.recordset.length) {
				const user = resp.recordset[0];
				if (validateMD5(password, user.MATKHAU.toString('hex'))) {
					res.render("login", {
						message: 'Đăng nhập thành công'
					})
				} else {
					res.render("login", {
						message: 'Tên đăng nhập hoặc mật khẩu không hợp lệ!'
					})
				}
			} else {
				res.render('login', {
					message: 'Tên đăng nhập hoặc mật khẩu không hợp lệ!'
				})
			}
			dbConn.close();
		}).catch(function (err) {
			console.log(err);
			dbConn.close();
		});
	}).catch(function (err) {
		res.redirect("login")

	});
})



const PORT = 3000;

app.listen(PORT, () => { console.log(`Listening on port ${PORT}`) });