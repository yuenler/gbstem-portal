import type { ClassValue } from 'clsx'
import clsx from 'clsx'
import { Timestamp } from 'firebase/firestore'
import { twMerge } from 'tailwind-merge'
import { alert } from '$lib/stores'

export function cn(...classes: Array<ClassValue>) {
  return twMerge(clsx(...classes))
}

export function clickOutside(node: HTMLElement) {
  function handleClick(e: MouseEvent) {
    if (!node.contains(e.target as HTMLElement)) {
      node.dispatchEvent(new CustomEvent('outclick'))
    }
  }
  document.addEventListener('click', handleClick, true)
  return {
    destroy() {
      document.removeEventListener('click', handleClick, true)
    },
  }
}

export function trapFocus(node: HTMLElement) {
  const previous = document.activeElement as HTMLElement
  function focusable() {
    return Array.from(
      node.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) as NodeListOf<HTMLElement>,
    )
  }
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return
    const current = document.activeElement
    const elements = focusable()
    const first = elements.at(0) as HTMLElement
    const last = elements.at(-1) as HTMLElement
    if (event.shiftKey && current === first) {
      last.focus()
      event.preventDefault()
    }
    if (!event.shiftKey && current === last) {
      first.focus()
      event.preventDefault()
    }
  }
  focusable()[0]?.focus()
  node.addEventListener('keydown', handleKeyDown)
  return {
    destroy() {
      node.removeEventListener('keydown', handleKeyDown)
      previous?.focus()
    },
  }
}

// replace html template with data
export function addDataToHtmlTemplate(html, template) {
  const htmlBody = html.replace(/{{(.*?)}}/g, (_, key) => {
    const keys = key.trim().split('.');
    let value = template.data;
    for (const k of keys) {
      value = value[k];
      if (value === undefined) {
        return '';
      }
    }
    return value;
  });
  return htmlBody;
}

export function formatTime24to12(time24: string): string {
  // Split the string by ":" to obtain hours and minutes
  const [hours24, minutes] = time24.split(':')

  // Parse the hours and minutes to integers
  const hours24Int = parseInt(hours24, 10)
  const minutesInt = parseInt(minutes, 10)

  // Create a date object at January 1, 2000, at the specified hours and minutes
  const date = new Date(2000, 0, 1, hours24Int, minutesInt)

  // Return the formatted time string in 12-hour format with AM/PM
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })
}

export const timestampToDate = (timestamp: Timestamp | Date) => {
  return new Date(timestamp.seconds * 1000)
}

export const classTodayHeld = (datesHeld: Date[]) => {
  return (
    datesHeld.filter(
      (date) =>
        new Date().toDateString() === timestampToDate(date).toDateString() &&
        new Date() > date,
    ).length > 0
  )
}

export function normalizeCapitals(name: string) {
  if(name === undefined) return ''
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function formatDateString(date: string): string {
  const dateObj = new Date(date)
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  return dateObj.toLocaleString(undefined, options)
}

export const formatDate = (date: Date) => {
  return date.toLocaleString('en-US', {
    weekday: 'short', // long, short, narrow
    month: 'short', // numeric, 2-digit, long, short, narrow
    day: 'numeric', // numeric, 2-digit
    hour: 'numeric', // numeric, 2-digit
    minute: 'numeric', // numeric, 2-digit
    hour12: true, // use 12-hour time format with AM/PM
  })
}

export function formatDateLocal(date: Date) {
  return date.toLocaleString('en-US', {
    weekday: 'long', // long, short, narrow
    month: 'long', // numeric, 2-digit, long, short, narrow
    day: 'numeric', // numeric, 2-digit
    hour: 'numeric', // numeric, 2-digit
    minute: 'numeric', // numeric, 2-digit
    hour12: true, // use 12-hour time format with AM/PM
    timeZoneName: 'short', 
  })
}

export function htmlToPlainText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')

  // Replace <br> and block elements with new lines
  doc.querySelectorAll('br').forEach((br) => br.replaceWith('\n'))
  doc
    .querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, ul, ol, li')
    .forEach((block) => {
      block.append(document.createTextNode('\n'))
    })

  return doc.body.textContent?.replace(/\n+/g, '\n').trim() || ''
}

export function copyToClipboard(emailHtmlContent: string) {
  const el = document.createElement('textarea')
  el.value = htmlToPlainText(emailHtmlContent)
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
  alert.trigger('success', 'Email copied to clipboard!')
}

export function toLocalISOString(date: Date) {
  const pad = (number: number) => (number < 10 ? '0' + number : number)
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1) // JavaScript months are 0-indexed.
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())

  return `${year}-${month}-${day}T${hour}:${minute}`.slice(0, 16)
}


export const isClassUpcoming = (date: Date) => {
  return (
    date.getTime() > Date.now() &&
    // Check if the class is within the next 30 minutes
    Math.abs(date.getTime() - new Date().getTime()) / (1000 * 60) < 30
  )
}
