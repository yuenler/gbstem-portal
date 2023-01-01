import { authErrorsJson } from '$lib/data'
import { cloneDeep, isPlainObject, isString, isNumber } from 'lodash'

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

export function serializeFieldSections(strippedFields) {
  strippedFields = cloneDeep(strippedFields)
  Object.keys(strippedFields).forEach(section => {
    strippedFields[section] = serializeFields(strippedFields[section])
  })
  return strippedFields
}

export function serializeFields(strippedFieldSection) {
  strippedFieldSection = cloneDeep(strippedFieldSection)
  Object.keys(strippedFieldSection).forEach(element => {
    if (isString(strippedFieldSection[element]) || isNumber(strippedFieldSection[element])) {
      strippedFieldSection[element] = {
        value: strippedFieldSection[element],
        error: false
      }
    }
  })
  return strippedFieldSection
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
  let str = ''
  return (
    authErrorsJson[code] ??
    (str = code.split('/')[1].split('-').join(' ')).charAt(0).toUpperCase() + str.slice(1) + '.'
  )
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
