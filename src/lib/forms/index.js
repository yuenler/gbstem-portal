import { authErrorsJson } from '$lib/data'
import { cloneDeep, isPlainObject } from 'lodash'

export function createFields(...fieldNames) {
  const fieldSection = {}
  fieldNames.forEach(element => {
    fieldSection[element] = {
      value: '',
      error: false
    }
  })
  return fieldSection
}

export function stripFieldSections(fields) {
  fields = cloneDeep(fields)
  Object.keys(fields).forEach(section => {
    fields[section] = stripFields(fields[section])
  })
  return fields
}

export function stripFields(fieldSection) {
  fieldSection = cloneDeep(fieldSection)
  Object.keys(fieldSection).forEach(element => {
    if (isPlainObject(fieldSection[element])) {
      fieldSection[element] = fieldSection[element].value
    }
  })
  return fieldSection
}

export function clearFields(fieldSection, ...fieldNames) {
  fieldSection = cloneDeep(fieldSection)
  if (fieldNames.length === 0) {
    fieldNames = Object.keys(fieldSection)
  }
  fieldNames.forEach(element => {
    fieldSection[element].value = ''
  })
  return fieldSection
}

export function enableErrors(fieldSection, ...fieldNames) {
  fieldSection = cloneDeep(fieldSection)
  if (fieldNames.length === 0) {
    fieldNames = Object.keys(fieldSection)
  }
  fieldNames.forEach(element => {
    fieldSection[element].error = true
  })
  return fieldSection
}

export function disableErrors(fieldSection, ...fieldNames) {
  fieldSection = cloneDeep(fieldSection)
  if (fieldNames.length === 0) {
    fieldNames = Object.keys(fieldSection)
  }
  fieldNames.forEach(element => {
    fieldSection[element].error = false
  })
  return fieldSection
}

export function getErrorMessage(code) {
  return authErrorsJson[code] ?? 'Something went wrong.'
}

export function isValid(formEl) {
  let valid = true
  Array.from(formEl.querySelectorAll('input')).every(input => {
    if (!input.checkValidity()) {
      valid = false
      return false
    }
    return true
  })
  return valid
}
