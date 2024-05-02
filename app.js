const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const dbPath = path.join(__dirname, 'userData.db')
const app = express()
app.use(express.json())

let db = null

const inilizerAndSeverResponse = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running on http://loaclhost:3000')
    })
  } catch (error) {
    console.log(`ERROR DB : ${error.message}`)
    process.exit(1)
  }
}
inilizerAndSeverResponse()
const validatePassword = password => {
  return password.length > 4
}

// rigister

app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectedUserQuery = ` SELECT * FROM user WHERE username = "${username}"`
  const dbUser = await db.get(selectedUserQuery)
  if (dbUser === undefined) {
    const createUserQuery = `INSERT INTO user (username,name,password,gender,location) VALUES ("${username}","${name}","${hashedPassword}","${gender}","${location}");`
    if (validatePassword(password)) {
      await db.run(createUserQuery)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

// login user

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const checkUserQuery = `SELECT * FROM user WHERE username = "${username}"`
  const resultQuery = await db.get(checkUserQuery)
  if (resultQuery === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatch = await bcrypt.compare(password, resultQuery.password)
    if (isPasswordMatch === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

// password update

app.put(`/change-password/`, async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const checkUserQuery = `SELECT * FROM user WHERE username = "${username}"`
  const resultQuery = await db.get(checkUserQuery)
  if (resultQuery === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      resultQuery.password,
    )
    if (isPasswordMatch === true) {
      if (validatePassword(newPassword)) {
        const hashPassword = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `UPDATE user SET password = "${hashPassword}" WHERE username = "${username}"`
        const user = await db.run(updatePasswordQuery)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
module.exports = app
