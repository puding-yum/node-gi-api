import moment from 'moment-timezone'
import { validationResult } from 'express-validator'

import CONSTANT from '../helper/constant.js'
import RESPONSE from '../helper/response.js'
import LOGGER from '../helper/logger.js'
import cloudinaryAPI from '../helper/cloudinary.js'

import Event from '../models/event.js'

const controller = {
  getAll: async (req, res) => {
    const requestTime = moment().tz(CONSTANT.WIB).format(CONSTANT.DATE_FORMAT)
    try {
      const events = await Event.find()

      return res.status(200).json(RESPONSE(requestTime, 'Get event success', events))
    } catch (err) {
      LOGGER.Error(err)

      return res.status(500).json(RESPONSE(requestTime, 'Internal server error', null, err))
    }
  },
  add: async (req, res) => {
    const requestTime = moment().tz(CONSTANT.WIB).format(CONSTANT.DATE_FORMAT)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(RESPONSE(requestTime, 'Value in body missing the validation requirement', null, errors.array()))
    }

    try {
      const { title, status, description, dateStart, dateEnd } = req.body

      const event = new Event({
        title,
        status,
        description,
        dateStart,
        dateEnd,
      })

      if (req.file) {
        // console.log(req.file)
        const imagePath = req.file.path
        const imageFolder = 'event/images'
        const image = await cloudinaryAPI.uploadImage(imagePath, imageFolder)
        event.imageUrl = image.imageUrl
        event.imageId = image.imageId
      }

      const newEvent = await event.save()

      return res.status(200).json(RESPONSE(requestTime, 'Add event success', newEvent))
    } catch (err) {
      LOGGER.Error(err)

      return res.status(500).json(RESPONSE(requestTime, 'Internal server error', null, err))
    }
  },
  update: async (req, res) => {
    const requestTime = moment().tz(CONSTANT.WIB).format(CONSTANT.DATE_FORMAT)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(RESPONSE(requestTime, 'Value in body missing the validation requirement', null, errors.array()))
    }

    try {
      const eventId = req.params.id
      let { title, status, description, dateStart, dateEnd } = req.body
      const event = await Event.findById(eventId)
      if (!event) {
        return res.status(404).json(RESPONSE(requestTime, 'Event not found!', null))
      }

      event.title = title ? title : event.title
      event.status = status ? status : event.status
      event.description = description ? description : event.description
      event.dateStart = dateStart ? dateStart : event.dateStart
      event.dateEnd = dateEnd ? dateEnd : event.dateEnd

      if (req.file) {
        const imagePath = req.file.path
        const imageFolder = 'event/images'
        if (event.imageId) {
          await cloudinaryAPI.deleteImage(event.imageId)
        }
        const newImage = await cloudinaryAPI.uploadImage(imagePath, imageFolder)
        event.imageUrl = newImage.imageUrl
        event.imageId = newImage.imageId
      }

      const updatedEvent = await event.save()

      return res.status(200).json(RESPONSE(requestTime, 'Event updated', updatedEvent))
    } catch (err) {
      LOGGER.Error(err)
      return res.status(500).json(RESPONSE(requestTime, 'Internal server error', null, err))
    }
  },
  del: async (req, res) => {
    const requestTime = moment().tz(CONSTANT.WIB).format(CONSTANT.DATE_FORMAT)

    try {
      const eventId = req.params.id
      const event = await Event.findById(eventId)
      if (!event) {
        return res.status(404).json(RESPONSE(requestTime, 'Event not found!', null))
      }

      await event.remove()

      return res.status(200).json(RESPONSE(requestTime, 'Delete event success', { eventId }))
    } catch (err) {
      LOGGER.Error(err)
      return res.status(500).json(RESPONSE(requestTime, 'Internal server error', null, err))
    }
  },
}

export default { controller }
