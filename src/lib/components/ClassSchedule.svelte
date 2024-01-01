<script lang="ts">
  import { onMount } from 'svelte'
  import { db, user } from '$lib/client/firebase'
  import { doc, getDoc, updateDoc, DocumentReference } from 'firebase/firestore'
  import Input from './Input.svelte'
  import { alert } from '$lib/stores'
  import { slide } from 'svelte/transition'
  import Dialog from '$lib/components/Dialog.svelte'
  import Button from '$lib/components/Button.svelte'
  import DialogActions from '$lib/components/DialogActions.svelte'

  let meetingTimes: Date[] = []
  let editMode: boolean = false
  let originalMeetingTimes: string[] = []
  let editedMeetingTimes: string[] = []
  const classesCollection = 'classesSpring24'
  let classId = ''
  let dialogEl: Dialog
  let emailHtmlContent = ''

  onMount(() => {
    return user.subscribe((user) => {
      if (user) {
        classId = user.object.uid
        const classDocRef: DocumentReference = doc(
          db,
          classesCollection,
          classId,
        )
        getDoc(classDocRef).then((classDoc) => {
          if (classDoc.exists()) {
            const data = classDoc.data()
            if (data && data.meetingTimes) {
              meetingTimes = data.meetingTimes.map(
                (time: { seconds: number; nanoseconds: number }) =>
                  new Date(time.seconds * 1000),
              )
              originalMeetingTimes = meetingTimes.map((time) =>
                toLocalISOString(time).slice(0, 16),
              )
              editedMeetingTimes = [...originalMeetingTimes]
            }
          }
        })
      }
    })
  })

  function generateMeetingTimeChangeEmail(): string {
    let addedClasses: string[] = []
    let removedClasses: string[] = []

    // Check for deletions
    originalMeetingTimes.forEach((time) => {
      if (!editedMeetingTimes.includes(time)) {
        removedClasses.push(`Class on ${formatDate(time)}`)
      }
    })

    // Check for additions
    editedMeetingTimes.forEach((time) => {
      if (!originalMeetingTimes.includes(time)) {
        addedClasses.push(`Class added on ${formatDate(time)}`)
      }
    })

    // Construct the email content in HTML
    let emailBody = '<html><body>'
    emailBody += '<p>Dear gbSTEM Parents,</p>'
    emailBody +=
      '<p>I would like to update you on some changes to our class meeting times:</p>'

    if (addedClasses.length > 0) {
      emailBody += '<p><strong>Classes Added:</strong></p><ul>'
      addedClasses.forEach((addClass) => {
        emailBody += `<li>${addClass}</li>`
      })
      emailBody += '</ul>'
    }

    if (removedClasses.length > 0) {
      emailBody += '<p><strong>Classes Removed:</strong></p><ul>'
      removedClasses.forEach((removeClass) => {
        emailBody += `<li>${removeClass}</li>`
      })
      emailBody += '</ul>'
    }

    if (addedClasses.length === 0 && removedClasses.length === 0) {
      return ''
    }

    emailBody +=
      '<p>Please take note of these changes. If you have any questions or concerns, feel free to contact me.</p>'
    emailBody += '<p>Best,<br>[Your Name]</p>'
    emailBody += '</body></html>'

    // Return the full email content in HTML format
    return emailBody
  }

  function toLocalISOString(date: Date) {
    const pad = (number: number) => (number < 10 ? '0' + number : number)

    const year = date.getFullYear()
    const month = pad(date.getMonth() + 1) // JavaScript months are 0-indexed.
    const day = pad(date.getDate())
    const hour = pad(date.getHours())
    const minute = pad(date.getMinutes())

    return `${year}-${month}-${day}T${hour}:${minute}`
  }

  async function updateMeetingTimes(): Promise<void> {
    const meetingTimesDate = editedMeetingTimes.map((time) => new Date(time))
    await updateDoc(doc(db, classesCollection, classId), {
      meetingTimes: meetingTimesDate,
    }).then(() => {
      alert.trigger('success', 'Meeting times updated!')
    })
  }

  function cancelChanges(): void {
    editMode = false
    editedMeetingTimes = [...originalMeetingTimes]
    updateDoc(doc(db, classesCollection, classId), {
      meetingTimes: meetingTimes,
    }).then(() => {
      alert.trigger('success', 'Changes cancelled!')
    })
  }

  function saveChanges(): void {
    editMode = false
    emailHtmlContent = generateMeetingTimeChangeEmail()
    originalMeetingTimes = [...editedMeetingTimes]
    updateMeetingTimes()
  }

  function formatDate(date: string): string {
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

  function htmlToPlainText(html: string): string {
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

  function copyToClipboard() {
    const el = document.createElement('textarea')
    el.value = htmlToPlainText(emailHtmlContent)
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    alert.trigger('success', 'Email copied to clipboard!')
  }
</script>

<Dialog bind:this={dialogEl} initial={emailHtmlContent !== ''} size="min">
  <svelte:fragment slot="title"
    >Please notify your student's parents about your class time changes</svelte:fragment
  >

  <div slot="description" class="space-y-4">
    <p>
      Here is an email template you can copy to send to your students' parents.
    </p>
    <div class="mt-5 flex justify-end">
      <Button on:click={copyToClipboard} class="flex items-center gap-1">
        <svg
          fill="#000000"
          height="20"
          width="20"
          version="1.1"
          id="Capa_1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 352.804 352.804"
          xml:space="preserve"
        >
          <g>
            <path
              d="M318.54,57.282h-47.652V15c0-8.284-6.716-15-15-15H34.264c-8.284,0-15,6.716-15,15v265.522c0,8.284,6.716,15,15,15h47.651
       v42.281c0,8.284,6.716,15,15,15H318.54c8.284,0,15-6.716,15-15V72.282C333.54,63.998,326.824,57.282,318.54,57.282z
        M49.264,265.522V30h191.623v27.282H96.916c-8.284,0-15,6.716-15,15v193.24H49.264z M303.54,322.804H111.916V87.282H303.54V322.804
       z"
            />
          </g>
        </svg>
        <span>Copy</span>
      </Button>
    </div>
    {@html emailHtmlContent}

    <DialogActions>
      <Button on:click={dialogEl.cancel}>Close</Button>
    </DialogActions>
  </div>
</Dialog>

<div class="p-4">
  <div class="mb-4 flex justify-between">
    <Button
      color="blue"
      class={`${editMode ? 'hidden' : ''}`}
      on:click={() => (editMode = true)}>Edit</Button
    >
    {#if editMode}
      <Button color="red" on:click={cancelChanges}>Cancel Changes</Button>
      <Button color="green" on:click={saveChanges}>Save Changes</Button>
    {/if}
  </div>

  <ul class="list-none space-y-2">
    {#each editedMeetingTimes as classTime, index (classTime)}
      <li
        class="flex items-center justify-between rounded-lg bg-gray-100 p-4"
        transition:slide={{ duration: 1000 }}
      >
        <span class="font-semibold">Class {index + 1}:</span>
        {#if editMode}
          <Input
            type="datetime-local"
            class="rounded border p-1"
            bind:value={editedMeetingTimes[index]}
          />
          <Button
            color="red"
            on:click={() => {
              editedMeetingTimes.splice(index, 1)
              editedMeetingTimes = editedMeetingTimes.slice()
            }}>Delete</Button
          >
        {:else}
          <span>{formatDate(classTime)}</span>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  /* Add any additional styles here */
</style>