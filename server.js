import express from 'express'
const port = process.env.PORT || 1111
const app = express()
import path  from 'path'
app.use(express.static('dist'))
app.get('/*', (req, res) =>{
  res.sendFile(path.resolve(__dirname+ '/../dist/index.html'), function (err) {
    if (err)
      res.status(500).send(err)
  })
})
app.listen(port, () =>{
  console.log(`Server listening on port ${port}`)
})