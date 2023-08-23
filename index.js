const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const port = process.env.PORT = 8080
const secretKey = process.env.SECRET_PASS
const fs = require('fs')

const app = express()

app.get('/', function (req, res) {
  const { ticker } = req.params
  const { key } = req.query

  if (!ticker || !key || key !== secretKey) {
    return res.status(400).send({ message: 'Please provide api key and ticker' })
  }

  const url = process.env.URL

  async function scrapeData () {
    try {
      const { data } = await axios.get(url)
      const $ = cheerio.load(data)
      const extractEventInfo = (element) => {
        const event = {
          name: '',
          date: ''
        }
        event.date = element.find('div.tribe-events-widget-events-list__event-wrapper.tribe-common-g-col > article > div > header > div').text()
          .trim()
        event.name = element.find('h3').text()
          .trim()
        return event
      }
      const listItems = $('#secondary > div.tribe-compatibility-container > div > div > div.tribe-events-widget-events-list__events > div')
      const events = []

      listItems.each((idx, el) => {
        const eventInfo = extractEventInfo($(el))
        events.push(eventInfo)
      })

      const jsonEventData = JSON.stringify(events, null, 2)

      res.setHeader('Content-Type', 'application/json')
      res.send(jsonEventData)

      fs.writeFile('events.json', JSON.stringify(events, null, 2), (err) => {
        if (err) {
          console.error('Error writing JSON file:', err)
        } else {
          console.log('Data saved as events.json')
        }
      })
    } catch (err) {
      console.error(err)
    }
  }
  scrapeData()
})

app.listen(port, () => console.log('port listen on port ' + port))
