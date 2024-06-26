<script lang="ts">
  import { onMount } from 'svelte'
  import { db, user } from '$lib/client/firebase'
  import { doc, getDoc, updateDoc, DocumentReference, Timestamp } from 'firebase/firestore'
  import Input from './Input.svelte'
  import { alert } from '$lib/stores'
  import { slide } from 'svelte/transition'
  import Dialog from '$lib/components/Dialog.svelte'
  import Button from '$lib/components/Button.svelte'
  import DialogActions from '$lib/components/DialogActions.svelte'
  import Card from './Card.svelte'
  import { MailIcon } from 'svelte-feather-icons'

  let meetingTimes: Date[] = []
  let editMode: boolean = false
  let originalMeetingTimes: string[] = []
  let editedMeetingTimes: string[] = []
  let classStatuses: string[] = []
  let feedbackCompleted: boolean[] = []
  let instructorName = ''
  let instructorEmail = ''
  let otherInstructorEmails = ''
  let course: string = ''
  let nextClassIndex = -1
  let link: string = ''
  const classesCollection = 'classesSpring24'
  let classId = ''
  let dialogEl: Dialog
  let addClassDialogEl: Dialog
  let emailHtmlContent = ''
  let studentList: {
    name: string
    email: string
    secondaryEmail: string
    phone: string
    grade: number
    school: string
  }[] = []
  let addingClass = false

  let classToBeAdded = ''

  const timestampToDate = (timestamp: Timestamp | Date) => {
    return new Date(timestamp.seconds * 1000)
  }

  const classTodayHeld = (datesHeld: Date[], classToday: Date) => {
    return datesHeld.filter((date) => classToday.toDateString() === timestampToDate(date).toDateString() && new Date() > date).length > 0
  }

  const classUpcoming = (date: Date) => {
    return date.getTime() > Date.now() && Math.abs(date.getTime() - new Date().getTime()) / (1000*60) < 30
  }

  let classIndex = -1

  const getStudentList = (studentUids: string[]) => {
    studentUids.forEach((studentUid) => {
      const studentDocRef: DocumentReference = doc(
        db,
        'registrationsSpring24',
        studentUid,
      )
      getDoc(studentDocRef).then((studentDoc) => {
        if (studentDoc.exists()) {
          const data = studentDoc.data()
          if (data) {
            studentList.push({
              name: `${data.personal.studentFirstName} ${data.personal.studentLastName}`,
              email: data.personal.email,
              secondaryEmail: data.personal.secondaryEmail,
              phone: data.personal.phoneNumber,
              grade: data.academic.grade,
              school: data.academic.school,
            })
          }
          studentList = [...studentList]
        }
      })
    })
  }

  function sendClassReminder(student: string, instructorName: string, instructorEmail: string, otherInstructorEmails: string, className: string, nextMeetingTime: string) {
    const confirmSend = confirm("Send class reminder to this student?");
    if (confirmSend) {
      if(nextMeetingTime === 'No Upcoming Classes') {
        alert.trigger('error', 'No upcoming classes found!')
        return;
      }
      if(student === 'all') {
      studentList.map((student) => {
        fetch('/api/remindStudents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: normalizeCapitals(student.name),
          email: student.email,
          instructorEmail: instructorEmail,
          otherInstructorEmails: otherInstructorEmails,
          class: className,
          classTime: nextMeetingTime,
          instructorName: normalizeCapitals(instructorName),
        })
      }).then(async (res) => {
        if (res.ok) {
          alert.trigger('success', 'Reminder emails were sent!')
        } else {
           const { message } = await res.json()
           alert.trigger('error', message)
        }
      });
      })
    } else {
      fetch('/api/remindStudents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: student,
          email: student.email,
          instructorEmail: instructorEmail,
          otherInstructorEmails: otherInstructorEmails,
          class: className,
          classTime: nextMeetingTime,
          instructorName: normalizeCapitals(instructorName),
        })
      }).then(async (res) => {
        if (res.ok) {
          alert.trigger('success', 'Reminder email was sent to ' + student + '!')
        } else {
           const { message } = await res.json()
           alert.trigger('error', message)
        }
      });
    }
  }
  }
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
            const studentUids = data?.students
            if (studentUids) {
              getStudentList(studentUids)
            }
            if (data && data.meetingTimes) {
              meetingTimes = data.meetingTimes.map(
                (time: { seconds: number; nanoseconds: number }) =>
                  new Date(time.seconds * 1000),
              )
              meetingTimes.sort((a, b) => {
                const dateA = new Date(a)
                const dateB = new Date(b)
                return dateA.getTime() - dateB.getTime()
              })
              originalMeetingTimes = meetingTimes.map((time) =>
                toLocalISOString(time),
              )
              editedMeetingTimes = [...originalMeetingTimes]
              course = data.course
              link = data.meetingLink
              classStatuses = data.classesStatus
              feedbackCompleted = data.feedbackCompleted
              instructorEmail = data.instructorEmail
              instructorName = data.instructorFirstName
              otherInstructorEmails = data.otherInstructorEmails
              checkStatuses()
              findNextClassDate()
            }
          }
        })
      }
    })
  })

  function checkStatuses() {
    for (let i = 0; i < meetingTimes.length; i++){
        if(new Date().getTime() > meetingTimes[i].getTime() && classStatuses[i] !== 'allComplete' && classStatuses[i] !== 'missingFeedback') {
          classStatuses[i] = feedbackCompleted[i] ? 'allComplete' : 'classMissed'
         } else if (classUpcoming(meetingTimes[i])) {
            classStatuses[i] = 'upcoming'
          } else if (classStatuses[i] === 'missingFeedback' && feedbackCompleted[i]) {
            classStatuses[i] = 'allComplete'
         }
         }
        updateDoc(doc(db, 'classesSpring24', classId), {
        classesStatus: classStatuses,
    });
  }

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

    return `${year}-${month}-${day}T${hour}:${minute}`.slice(0, 16)
  }

  async function updateMeetingTimes(newFeedback: boolean[], newClassStatuses: string[]): Promise<void> {
    const meetingTimesDate = editedMeetingTimes.map((time) => new Date(time))
    await updateDoc(doc(db, classesCollection, classId), {
      meetingTimes: meetingTimesDate,
      feedbackCompleted: newFeedback,
      classesStatus: newClassStatuses,
    }).then(() => {
      findNextClassDate()
      alert.trigger('success', 'Meeting times updated!')
      location.reload()
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
    // sort the meeting times
    editedMeetingTimes.sort((a, b) => {
      const dateA = new Date(a)
      const dateB = new Date(b)
      return dateA.getTime() - dateB.getTime()
    })
    // remove duplicates from the meeting times
    editedMeetingTimes = editedMeetingTimes.filter(
      (time, index) => editedMeetingTimes.indexOf(time) === index,
    )

    let removed: number[]= []
    originalMeetingTimes.map((x, index) => {if(!editedMeetingTimes.includes(x)) removed.push(index)});

    let added: number[] = []
    editedMeetingTimes.map((x, index) => {if(!originalMeetingTimes.includes(x)) added.push(index)});

    let newFeedback = [...feedbackCompleted]
    let newClassStatuses = [...classStatuses]
    removed.forEach((index) => {
      newFeedback.splice(index, 1)
      newClassStatuses.splice(index, 1)
    })
    added.forEach((index) => {
      newFeedback = [
       ...newFeedback.slice(0, index),
       false,
       ...newFeedback.slice(index)
      ];
      newClassStatuses = [
       ...newClassStatuses.slice(0, index),
        'sometime',
       ...newClassStatuses.slice(index)
      ];
    })

    originalMeetingTimes = [...editedMeetingTimes]
    feedbackCompleted = newFeedback
    classStatuses = newClassStatuses
    updateMeetingTimes(feedbackCompleted, classStatuses)
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

  function findNextClassDate() {
    for (let i = 0; i < editedMeetingTimes.length; i++) {
      const diff = new Date().getTime() - new Date(editedMeetingTimes[i]).getTime()
      if (diff < 0) {
        nextClassIndex = i
        break
      }
    }
  }

  const recordClass = async (classId: string, link: string) => {
    const classDoc = await getDoc(doc(db, 'classesSpring24', classId))
    if(classDoc.exists()) {
      const confirmHoldClass = confirm("Please confirm you are holding class now.")
      if (confirmHoldClass) {
        const data = classDoc.data()
        let datesHeld: Date[] = []
        if(!classTodayHeld(data.datesHeld, new Date)) datesHeld = [...data.datesHeld, new Date()]
          let classToday = false
           if (nextClassIndex !== -1 && nextClassIndex < meetingTimes.length && new Date().toDateString() === meetingTimes[nextClassIndex].toDateString()) {
              classToday = true
              classStatuses[nextClassIndex] = feedbackCompleted[nextClassIndex] ? 'allComplete' : 'missingFeedback'
            }
          if(!classToday) {
            alert.trigger('error', 'No class session found today! Please update your class schedule if you are planning to hold class today.')
            setTimeout(() => window.open(link), 1000)
          } else {
            updateDoc(doc(db, 'classesSpring24', classId), {
              datesHeld: datesHeld,
              classesStatus: classStatuses,
            });
            window.open(link)
          }
      }
    } else {
      alert.trigger('error', 'Class Not Found!');
    }
  }

  function copyEmails() {
    const emailList = studentList
      .map(
        (student) =>
          `${student.email}${
            student.secondaryEmail ? `, ${student.secondaryEmail}` : ''
          }`,
      )
      .join(', ')

    navigator.clipboard
      .writeText(emailList)
      .then(() => {
        alert.trigger('success', 'Emails copied to clipboard!')
      })
      .catch((err) => {
        alert.trigger('error', 'Failed to copy emails to clipboard!')
      })
  }

  function normalizeCapitals(name: string) {
    return name.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
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
  <Card class="mb-4">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="font-bold">Class List</h2>
      <Button on:click={copyEmails} class="flex items-center gap-1">
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
    <div style="overflow: auto;">
      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th
              style="white-space: nowrap; border-bottom: 1px solid #ccc; padding: 8px;"
              >Student Name</th
            >
            <th
              style="white-space: nowrap; border-bottom: 1px solid #ccc; padding: 8px;"
              >Email</th
            >
            <th
              style="white-space: nowrap; border-bottom: 1px solid #ccc; padding: 8px;"
              >Secondary Email</th
            >
            <th
              style="white-space: nowrap; border-bottom: 1px solid #ccc; padding: 8px;"
              >Phone</th
            >
            <th
              style="white-space: nowrap; border-bottom: 1px solid #ccc; padding: 8px;"
              >Grade</th
            >
            <th
              style="white-space: nowrap; border-bottom: 1px solid #ccc; padding: 8px;"
              >School</th
            >
            <th
              style="white-space: nowrap; border-bottom: 1px solid #ccc; padding: 8px;"
              ></th
            >
          </tr>
        </thead>
        <tbody>
          {#each studentList as student}
            <tr style="border-bottom: 1px solid #ccc;">
              <td style="padding: 8px;">{normalizeCapitals(student.name)}</td>
              <td style="padding: 8px;">{student.email}</td>
              <td style="padding: 8px;">{student.secondaryEmail}</td>
              <td style="padding: 8px;">{student.phone}</td>
              <td style="padding: 8px;">{student.grade}</td>
              <td style="padding: 8px;">{student.school}</td>
              <td><Button color = 'blue' on:click = {() => sendClassReminder(normalizeCapitals(student.name), instructorName, instructorEmail, otherInstructorEmails, course, nextClassIndex === -1 ? 'No Upcoming Classes' : course + ', ' + formatDate(editedMeetingTimes[nextClassIndex]))}><MailIcon size="16"/></Button></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </Card>
  <Card class = "mb-4">
    <div class="font-bold mb-2">Next Upcoming Class:</div>
      <div>
        {nextClassIndex === -1 ? 'No Upcoming Classes' : course + ', ' + formatDate(editedMeetingTimes[nextClassIndex])}
      </div>
      <Button color="blue" class="mb-2 mt-4" on:click={() => {recordClass(classId, link)}}
        >Join Class</Button>
        <Button color = 'blue' on:click = {() => sendClassReminder('all', instructorName, instructorEmail, otherInstructorEmails, course, nextClassIndex === -1 ? 'No Upcoming Classes' : course + ', ' + formatDate(editedMeetingTimes[nextClassIndex]))}>Send Class Reminder</Button>
    </Card>

  <div class="mb-4 flex justify-between">
    <Button
      color="blue"
      class={`${editMode ? 'hidden' : ''}`}
      on:click={() => (editMode = true)}>Edit Schedule</Button
    >
    <Button
      color="green"
      class={`${editMode ? 'hidden' : ''}`}
      on:click={() => (addingClass = true)}>Add Class to Schedule</Button
    >

    <Dialog
      bind:this={addClassDialogEl}
      initial={addingClass}
      size="min"
      on:cancel={() => (addingClass = false)}
    >
      <svelte:fragment slot="title">Add Class to Schedule</svelte:fragment>

      <div slot="description" class="space-y-4">
        <p>
          Please enter the date and time of the class you would like to add.
        </p>

        <Input
          type="datetime-local"
          class="rounded border p-1"
          bind:value={classToBeAdded}
        />
        <Button
          color="green"
          on:click={() => {
            editedMeetingTimes.push(classToBeAdded)
            editedMeetingTimes = editedMeetingTimes.slice()
            saveChanges()
            addingClass = false
          }}>Add Class</Button
        >
        <DialogActions>
          <Button on:click={() => (addingClass = false)}>Close</Button>
        </DialogActions>
      </div>
    </Dialog>

    {#if editMode}
      <Button color="red" on:click={cancelChanges}>Cancel Changes</Button>
      <Button color="green" on:click={saveChanges}>Save Changes</Button>
    {/if}
  </div>
  <ul class="list-none space-y-2">
    {#each editedMeetingTimes as classTime, index (classTime)}
      {#if classStatuses[index] === 'classMissed'}
      <li
          class="flex items-center justify-between rounded-lg bg-red-100 p-4"
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
            <span>{course + " at " + formatDate(classTime)}</span>
          {/if}
        </li>
      {:else if classStatuses[index] === 'missingFeedback'}
          <li
          class="flex items-center justify-between rounded-lg bg-yellow-100 p-4"
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
            <span>{course + " at " + formatDate(classTime)}</span>
          {/if}
        </li>
        {:else if classStatuses[index] === 'upcoming'}
        <li
        class="flex items-center justify-between rounded-lg bg-blue-100 p-4"
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
          <span>{course + " at " + formatDate(classTime)}</span>
        {/if}
      </li>
      {:else if classStatuses[index] === 'allComplete'}
      <li
          class="flex items-center justify-between rounded-lg bg-green-100 p-4"
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
            <span>{course + " at " + formatDate(classTime)}</span>
          {/if}
        </li>
      {:else}
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
            <span>{course + " at " + formatDate(classTime)}</span>
          {/if}
        </li>
      {/if}
    {/each}
  </ul>
</div>

<style>
  /* Add any additional styles here */
</style>
