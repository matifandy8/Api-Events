const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const port = process.env.PORT || 8081
const secretKey = process.env.SECRET_PASS
const cors = require('cors')

const fs = require('fs')

const app = express()
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://localhost:3000'
    ]

    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    if (!origin) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  }
}))
app.disable('x-powered-by')

app.get('/events', function (req, res) {
  const { key } = req.query

  if (key !== secretKey) {
    return res.status(400).send({ message: 'Please provide api key' })
  }

  async function scrapeData () {
    try {
      const { data } = await axios.get('https://www.sportstourismnews.com/sports-events-calendar-uk-global-sporting-events/')
      const $ = cheerio.load(data)
      const extractEventInfo = (element) => {
        const event = {
          name: '',
          date: ''
        }
        const month = element.find('div.tribe-events-widget-events-list__event-date-tag.tribe-common-g-col > time > span.tribe-events-widget-events-list__event-date-tag-month').text()
          .trim()
        const day = element.find('div.tribe-events-widget-events-list__event-date-tag.tribe-common-g-col > time > span.tribe-events-widget-events-list__event-date-tag-daynum.tribe-common-h2.tribe-common-h4--min-medium').text()
          .trim()
        event.name = element.find('h3').text()
          .trim()
        event.date = `${day} ${month}`

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
