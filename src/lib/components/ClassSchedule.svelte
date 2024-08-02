<script lang="ts">
  import { onMount } from 'svelte'
  import { db, user } from '$lib/client/firebase'
  import {
    doc,
    getDoc,
    updateDoc,
    DocumentReference,
    Timestamp,
    setDoc,
  } from 'firebase/firestore'
  import Input from './Input.svelte'
  import { slide } from 'svelte/transition'
  import { alert } from '$lib/stores'
  import Dialog from '$lib/components/Dialog.svelte'
  import Button from '$lib/components/Button.svelte'
  import DialogActions from '$lib/components/DialogActions.svelte'
  import Card from './Card.svelte'
  import { MailIcon } from 'svelte-feather-icons'
  import { classTodayHeld, 
          copyToClipboard, 
          formatDateString, 
          isClassUpcoming, 
          normalizeCapitals, 
          timestampToDate, 
          toLocalISOString
        } from '$lib/utils'
  import sendClassReminder from './helpers/sendClassReminder'
  import type Student from './types/Student'
  import generateMeetingTimeChangeEmail from './helpers/generateMeetingTimeChangeEmail'
  import { classesCollection, registrationsCollection } from '$lib/data/constants'
  import { ClassStatus } from './helpers/ClassStatus'
    import InstructorFeedbackForm from './forms/InstructorFeedbackForm.svelte'
    import ClassDetailsForm from './forms/ClassDetailsForm.svelte'
    import { bind } from 'lodash-es'
    import { SubRequestStatus } from './helpers/SubRequestStatus'

  let editMode: boolean = false
  let originalMeetingTimes: string[] = []
  let editedMeetingTimes: string[] = []
  let values: Data.ClassDetails = {
    id: '',
    students: [],
    classStatuses: [],
    feedbackCompleted: [],
    instructorFirstName: '',
    instructorLastName: '',
    instructorEmail: '',
    otherInstructorEmails: '',
    course: '',
    meetingLink: '',
    meetingTimes: [],
    completedClassDates: []
  }

  //index of the next class date from the list of meeting times
  let nextClassIndex = -1
  let classId = ''
  let dialogEl: Dialog
  let addClassDialogEl: Dialog
  let feedbackDialogEl: Dialog
  let classDetailsDialogEl: Dialog
  let studentDetailsDialogEl: Dialog
  let subRequestDialogEl: Dialog
  let emailHtmlContent = ''
  let studentList: Student[] = []
  let addingClass = false

  let classToBeAdded = ''
  let subRequestDate: string = ''
  let subRequestClassNumber: number = 0
  let subRequestNotes: string = ''
  /**
   * Iterates through each student UID to get student info
   * @param studentUids
   */
  const getStudentList = (studentUids: string[]) => {
    studentUids.forEach((studentUid) => {
      const studentDocRef: DocumentReference = doc(
        db,
        registrationsCollection,
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

  function checkStatuses() {
    
    let {classStatuses, feedbackCompleted, meetingTimes} = values

    classStatuses = classStatuses.concat(Array(meetingTimes.length - classStatuses.length).fill(ClassStatus.ClassInFuture));

    const updateStatuses = (classStatus: string, index: number) => {
      if(new Date() > meetingTimes[index] && classStatus !== ClassStatus.EverythingComplete && classStatus !== ClassStatus.FeedbackIncomplete) {
        return feedbackCompleted[index] ? ClassStatus.EverythingComplete : ClassStatus.ClassNotHeld
      } else if (isClassUpcoming(meetingTimes[index])) {
        return ClassStatus.ClassUpcomingSoon
      } else if (classStatus === ClassStatus.FeedbackIncomplete && feedbackCompleted[index]) {
        return ClassStatus.EverythingComplete
      } else {
        return classStatus
      }
    }

    classStatuses = classStatuses.map(updateStatuses)
    
    updateDoc(doc(db, classesCollection, classId), {
      classStatuses: classStatuses,
    })
  }

  async function updateMeetingTimes(
    newFeedback: boolean[],
    newClassStatuses: string[],
  ): Promise<void> {
    const meetingTimesDate = editedMeetingTimes.map((time) => new Date(time))
    await updateDoc(doc(db, classesCollection, classId), {
      meetingTimes: meetingTimesDate,
      feedbackCompleted: newFeedback,
      classStatuses: newClassStatuses,
    }).then(() => {
      nextClassIndex = findNextClassDate()
      alert.trigger('success', 'Meeting times updated!')
      location.reload()
    })
  }

  function cancelChanges(): void {
    editMode = false
    editedMeetingTimes = [...originalMeetingTimes]
    updateDoc(doc(db, classesCollection, classId), {
      meetingTimes: values.meetingTimes,
    }).then(() => {
      alert.trigger('success', 'Changes cancelled!')
    })
  }

  function saveChanges(): void {
    editMode = false
    emailHtmlContent = generateMeetingTimeChangeEmail(originalMeetingTimes, editedMeetingTimes)
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

    // Find the removed and added classes
    let removed: number[] = []
    originalMeetingTimes.map((x, index) => {
      if (!editedMeetingTimes.includes(x)) removed.push(index)
    })

    let added: number[] = []
    editedMeetingTimes.map((x, index) => {
      if (!originalMeetingTimes.includes(x)) added.push(index)
    })

    let { feedbackCompleted, classStatuses } = values

    let newFeedback = [...feedbackCompleted]
    let newClassStatuses = [...classStatuses]

    // Update the feedback and classStatuses arrays based on deleted/added times
    removed.forEach((index) => {
      newFeedback.splice(index, 1)
      newClassStatuses.splice(index, 1)
    })
    added.forEach((index) => {
      newFeedback = [
        ...newFeedback.slice(0, index),
        false,
        ...newFeedback.slice(index),
      ]
      newClassStatuses = [
        ...newClassStatuses.slice(0, index),
        ClassStatus.ClassInFuture,
        ...newClassStatuses.slice(index),
      ]
    })

    originalMeetingTimes = [...editedMeetingTimes]
    feedbackCompleted = newFeedback
    classStatuses = newClassStatuses
    updateMeetingTimes(feedbackCompleted, classStatuses)
  }

  /**
   * Find the index of the next class date that hasn't passed yet from the list of meeting times
   * @returns The index of the next class date
   */
  function findNextClassDate() {
     return values.meetingTimes.findIndex(schedule => new Date(schedule) > new Date())
  }

  /**
   * Record the class session by updating the status of the upcoming class in the class document
   * @param classId The ID of the class to update
   * @param link The link to the class session
   */
  const recordClass = async (classId: string) => {
    let {meetingLink, meetingTimes, feedbackCompleted, classStatuses, completedClassDates} = values;
      const confirmHoldClass = confirm(
        `Please confirm you are holding class now. Confirming will redirect you to ${meetingLink}`,
      )
      if (confirmHoldClass) {
        if (!classTodayHeld(completedClassDates))
          completedClassDates = [...completedClassDates, new Date()]
        let classToday = false
        if (
          nextClassIndex !== -1 &&
          nextClassIndex < meetingTimes.length &&
          new Date().toDateString() ===
            meetingTimes[nextClassIndex].toDateString()
        ) {
          classToday = true
          classStatuses[nextClassIndex] = feedbackCompleted[nextClassIndex]
            ? ClassStatus.EverythingComplete
            : ClassStatus.FeedbackIncomplete
        }
        if (!classToday) {
          alert.trigger(
            'error',
            'No class session found today! Please update your class schedule if you are planning to hold class today.',
          )
          return;
        } else {
            updateDoc(doc(db, classesCollection, classId), {
            completedClassDates: completedClassDates,
            classStatuses: classStatuses,
          })
        }
        window.open(meetingLink)
      }
    } 

  function sendSubRequest() {
    const subRequest: Data.SubRequest = {
      classNumber: subRequestClassNumber,
      dateOfClass: new Date(subRequestDate),
      id: classId,
      notes: subRequestNotes,
      course: values.course,
      originalInstructorEmail: values.instructorEmail,
      subInstructorFirstName: '',      
      subInstructorEmail: '',
      subInstructorId: '',
      subRequestStatus: SubRequestStatus.SubstituteNeeded,
      link: values.meetingLink,
    }
    setDoc(doc(db, 'subRequests', classId + '---' + subRequestClassNumber), subRequest).then((res) => {
      alert.trigger('success', 'Sub request sent!')
      window.setTimeout(() => { location.reload() }, 1000)
    }).catch((err) => {
      alert.trigger('error', 'Failed to send sub request, please try again.')
    })
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
            const classData = classDoc.data()
            values = classData as Data.ClassDetails
            values.meetingTimes = values.meetingTimes.map((time: Date) => (timestampToDate(time)))
            values.completedClassDates = values.completedClassDates.map((time: Date) => (timestampToDate(time)))
            let { students, meetingTimes } = values
            if (students) {
              getStudentList(students)
            }
            if (values && meetingTimes) {
              meetingTimes.sort((a, b) => {
                return a.getTime() - b.getTime()
              })
              originalMeetingTimes = meetingTimes.map((time: Date) =>
                toLocalISOString(time),
              )
              editedMeetingTimes = [...originalMeetingTimes]
              checkStatuses()
              nextClassIndex = findNextClassDate()
            }
          }
        })
      }
    })
  })
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
      <Button on:click={() => copyToClipboard(emailHtmlContent)} class="flex items-center gap-1">
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
<Dialog bind:this={feedbackDialogEl} size="full" alert>
  <svelte:fragment slot="title"><div class = "flex justify-between items-center">Weekly {values.course} Class Feedback Form <Button color = 'red' class="font-light" on:click={feedbackDialogEl.cancel}>Close</Button></div> </svelte:fragment>
  <div slot="description">
    <InstructorFeedbackForm classBeingSubbed={undefined}/>
  </div>
</Dialog>
<ClassDetailsForm bind:classDetailsDialogEl dialog={true}/>

<div class="p-0">
  <Dialog bind:this={studentDetailsDialogEl} size="full">
    <svelte:fragment slot="title"><div class = "flex justify-between items-center"> Class List <Button color = 'red' class="font-light" on:click={studentDetailsDialogEl.cancel}>Close</Button></div> </svelte:fragment>
  <Card slot="description" class="mb-4">
    <div class="mb-4 flex items-center justify-end">
      <Button on:click={copyEmails} class="flex items-center gap-1 justify-end">
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
            ></th>
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
              <td
                ><Button
                  color="blue"
                  on:click={() =>
                    sendClassReminder({
                      studentList,
                      studentName: normalizeCapitals(student.name),
                      studentEmail: student.email,
                      instructorName: values.instructorFirstName + ' ' + values.instructorLastName,
                      instructorEmail: values.instructorEmail,
                      otherInstructorEmails: values.otherInstructorEmails,
                      className: values.course,
                      nextMeetingTime: nextClassIndex === -1
                        ? 'No Upcoming Classes'
                        : values.course +
                            ', ' +
                            formatDateString(editedMeetingTimes[nextClassIndex]),
                    })}><MailIcon size="16" /></Button
                ></td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </Card>
  </Dialog>
  <Card class="mb-4">
    <div class="mb-2 font-bold">Next Upcoming Class:</div>
    <div>
      {nextClassIndex === -1
        ? 'No Upcoming Classes'
        : values.course + ', ' + formatDateString(editedMeetingTimes[nextClassIndex])}
    </div>
    <Button
      color="blue"
      class="mb-2 mt-4"
      on:click={() => {
        recordClass(classId)
      }}>Join Class</Button
    >
    <Button
      color="blue"
      on:click={() =>
        sendClassReminder(
          {
          studentList,
          instructorName: values.instructorFirstName,
          instructorEmail: values.instructorEmail,
          otherInstructorEmails: values.otherInstructorEmails,
          className: values.course,
          nextMeetingTime: nextClassIndex === -1
            ? 'No Upcoming Classes'
            : values.course + ', ' + formatDateString(editedMeetingTimes[nextClassIndex]),
        })}>Send Class Reminder</Button
    >
    <Button color="blue" class="mt-2" on:click={() => feedbackDialogEl.open()}>Submit Class Feedback</Button>
    <Button color="blue" class="mt-2" on:click={() => classDetailsDialogEl.open()}>Edit Class Details</Button>
    <Button color="blue" class="mt-2" on:click={() => studentDetailsDialogEl.open()}>View Class List</Button>
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
    {#each editedMeetingTimes as classTime, classNumber }
    <Dialog bind:this={subRequestDialogEl} initial={false} size="min">
      <svelte:fragment slot="title"><div class="flex items-center justify-between">Submit A Sub Request<DialogActions>
        <Button on:click={() => subRequestDialogEl.close()} color='red'>Close</Button>
      </DialogActions></div></svelte:fragment>
      <div slot="description" class="space-y-4">
        <Input
          type="number"
          class="rounded border p-1"
          bind:value={subRequestClassNumber}
          floating
          label="Please confirm the class number ."
        />
        <Input
          type="datetime-local"
          class="rounded border p-1"
          bind:value={subRequestDate}
          floating
          label="Please confirm the date and time of the class you would like to request a sub for."
        />
        <Input
          type="text"
          class="rounded border p-1"
          bind:value={subRequestNotes}
          label="Please describe what topic/lesson the substitute class will cover, and any helpful notes for the substitute instructor."
        />
        <Button
          color="green"
          on:click={() => {
            sendSubRequest()
            subRequestDialogEl.close()
          }}>Confirm Request</Button
        >
      </div>
      </Dialog>
      {#if values.classStatuses[classNumber] === ClassStatus.ClassNotHeld}
        <li
          class="flex items-center justify-between rounded-lg bg-red-100 p-4"
          transition:slide={{ duration: 1000 }}
        >
          <span class="font-semibold">Class {classNumber + 1}:</span>
          {#if editMode}
            <Input
              type="datetime-local"
              class="rounded border p-1"
              bind:value={editedMeetingTimes[classNumber]}
            />
            <Button
              color="red"
              on:click={() => {
                editedMeetingTimes.splice(classNumber, 1)
                editedMeetingTimes = editedMeetingTimes.slice()
              }}>Delete</Button
            >
          {:else}
            <span>{values.course + ' at ' + formatDateString(classTime)}</span>
          {/if}
        </li>
      {:else if values.classStatuses[classNumber] === ClassStatus.FeedbackIncomplete}
        <li
          class="flex items-center justify-between rounded-lg bg-yellow-100 p-4"
          transition:slide={{ duration: 1000 }}
        >
          <span class="font-semibold">Class {classNumber + 1}:</span>
          {#if editMode}
            <Input
              type="datetime-local"
              class="rounded border p-1"
              bind:value={editedMeetingTimes[classNumber]}
            />
            <Button
              color="red"
              on:click={() => {
                editedMeetingTimes.splice(classNumber, 1)
                editedMeetingTimes = editedMeetingTimes.slice()
              }}>Delete</Button
            >
          {:else}
            <span>{values.course + ' at ' + formatDateString(classTime)}</span>
          {/if}
        </li>
      {:else if values.classStatuses[classNumber] === ClassStatus.ClassUpcomingSoon}
        <li
          class="flex items-center justify-between rounded-lg bg-blue-100 p-4"
          transition:slide={{ duration: 1000 }}
        >
          <span class="font-semibold">Class {classNumber + 1}:</span>
          {#if editMode}
            <Input
              type="datetime-local"
              class="rounded border p-1"
              bind:value={editedMeetingTimes[classNumber]}
            />
            <Button
              color="red"
              on:click={() => {
                editedMeetingTimes.splice(classNumber, 1)
                editedMeetingTimes = editedMeetingTimes.slice()
              }}>Delete</Button
            >
          {:else}
            <span>{values.course + ' at ' + formatDateString(classTime)}</span>
          {/if}
        </li>
      {:else if values.classStatuses[classNumber] === ClassStatus.EverythingComplete}
        <li
          class="flex items-center justify-between rounded-lg bg-green-100 p-4"
          transition:slide={{ duration: 1000 }}
        >
          <span class="font-semibold">Class {classNumber + 1}:</span>
          {#if editMode}
            <Input
              type="datetime-local"
              class="rounded border p-1"
              bind:value={editedMeetingTimes[classNumber]}
            />
            <Button
              color="red"
              on:click={() => {
                editedMeetingTimes.splice(classNumber, 1)
                editedMeetingTimes = editedMeetingTimes.slice()
              }}>Delete</Button
            >
          {:else}
            <span>{values.course + ' at ' + formatDateString(classTime)}</span>
          {/if}
        </li>
      {:else}
        <li
          class="flex items-center justify-between rounded-lg bg-gray-100 p-4"
          transition:slide={{ duration: 1000 }}
        >
          <span class="font-semibold">Class {classNumber + 1}:</span>
          {#if editMode}
            <Input
              type="datetime-local"
              class="rounded border p-1"
              bind:value={editedMeetingTimes[classNumber]}
            />
            <Button
              color="red"
              on:click={() => {
                editedMeetingTimes.splice(classNumber, 1)
                editedMeetingTimes = editedMeetingTimes.slice()
              }}>Delete</Button
            >
          {:else}
            <Button color = "blue" on:click={() => {
              subRequestDate = classTime
              subRequestClassNumber = classNumber + 1
              subRequestNotes = ''
              subRequestDialogEl.open()
            }}>Request A Sub</Button>
            <span>{values.course + ' at ' + formatDateString(classTime)}</span>
          {/if}
        </li>
      {/if}
    {/each}
  </ul>
</div>

<style>
  /* Add any additional styles here */
</style>
