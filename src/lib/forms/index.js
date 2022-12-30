import { authErrorsJson } from '$lib/data'

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

export function clearFields(fieldSection, ...fieldNames) {
  if (fieldNames.length === 0) {
    fieldNames = Object.keys(fieldSection)
  }
  fieldNames.forEach(element => {
    fieldSection[element].value = ''
  })
  return fieldSection
}

export function enableErrors(fieldSection, ...fieldNames) {
  if (fieldNames.length === 0) {
    fieldNames = Object.keys(fieldSection)
  }
  fieldNames.forEach(element => {
    fieldSection[element].error = true
  })
  return fieldSection
}

export function disableErrors(fieldSection, ...fieldNames) {
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
