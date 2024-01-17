<script lang="ts">
  import { db, user } from '$lib/client/firebase'
  import { onMount } from 'svelte'
  import Card from '$lib/components/Card.svelte'
  import Loading from '$lib/components/Loading.svelte'
  import { fade } from 'svelte/transition'
  import Dialog from '$lib/components/Dialog.svelte'
  import Button from '$lib/components/Button.svelte'
  import DialogActions from '$lib/components/DialogActions.svelte'
  import {
    collection,
    getDocs,
    getDoc,
    updateDoc,
    arrayUnion,
    doc,
    arrayRemove,
  } from 'firebase/firestore'
  import { alert } from '$lib/stores'
  import StudentSelect from '$lib/components/StudentSelect.svelte'

  type ClassInfo = {
    id: string
    className: string
    classDays: string[]
    classTimes: string[]
    course: string
    instructorFirstName: string
    instructorLastName: string
    spotsRemaining: number
  }

  let classes: ClassInfo[] = []
  let loading = true
  let dialogEl: Dialog
  let dialogClassDetails: ClassInfo | null = null
  let selectedStudentUid = ''
  let childName = ''

  const studentUidToClassIds: {
    [studentUid: string]: string[]
  } = {}
  const uidToName: Record<string, string> = {}

  function formatTime24to12(time24: string): string {
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

  let isStudent = true

  const determineStudentEnrollment = async (user: Data.User.Store) => {
    const uid = user.object.uid
    for (let i = 1; i < 6; ++i) {
      const docRef = await getDoc(
        doc(db, 'registrationsSpring24', `${uid}-${i}`),
      )
      if (docRef.exists() && docRef.data()?.meta.submitted) {
        const studentUid = `${uid}-${i}`
        const studentClassIds = docRef.data()?.classes ?? []
        studentUidToClassIds[studentUid] = studentClassIds
        const name =
          `${docRef.data().personal.studentFirstName} ${
            docRef.data().personal.studentLastName
          }`.trim() || `Child ${i}`
        uidToName[studentUid] = name
      }
    }
  }

  const getData = () => {
    return user.subscribe(async (user) => {
      if (user?.profile.role === 'instructor') {
        isStudent = false
      }
      const classesCollectionRef = collection(db, 'classesSpring24')
      const querySnapshot = await getDocs(classesCollectionRef)
      classes = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        let classInfo: ClassInfo = {
          id: doc.id,
          className: data.className,
          classDays: [],
          classTimes: [],
          course: data.course,
          instructorFirstName: data.instructorFirstName,
          instructorLastName: data.instructorLastName,
          spotsRemaining: data.students
            ? data.classCap - data.students.length
            : data.classCap,
        }
        // Assuming there are a fixed number of class days and times
        for (let i = 1; i <= 2; i++) {
          // Adjust this loop if there are more days and times
          if (data[`classDay${i}`] && data[`classTime${i}`]) {
            classInfo.classDays.push(data[`classDay${i}`])
            classInfo.classTimes.push(data[`classTime${i}`])
          }
        }
        return classInfo
      })
      if (user && isStudent) {
        await determineStudentEnrollment(user)
      }
      loading = false
    })
  }

  onMount(() => {
    getData()
  })

  function formatClassTimes(
    classDays: string[],
    classTimes: string[],
  ): string[] {
    return classDays.map(
      (day, index) => `${day} at ${formatTime24to12(classTimes[index])}`,
    )
  }

  const isEnrolled = (classId: string, studentUid: string): boolean => {
    if (studentUid === '') {
      return false
    }
    return studentUidToClassIds[studentUid].includes(classId)
  }

  const toggleEnrollment = async (classId: string) => {
    if (selectedStudentUid === '') {
      alert.trigger('error', 'Please select a child!')
      return
    }
    if (isEnrolled(classId, selectedStudentUid)) {
      await unenrollFromClass(classId)
    } else {
      await enrollInClass(classId)
    }
    getData()
  }

  async function enrollInClass(classId: string): Promise<void> {
    if (selectedStudentUid === '') {
      alert.trigger('error', 'Please select a child!')
      return
    }
    const classDocRef = doc(db, 'classesSpring24', classId)
    // get updated number of students in the class
    const classDoc = await getDoc(classDocRef)
    const classData = classDoc.data()
    const numStudents = classData?.students?.length ?? 0
    if (numStudents >= classData?.classCap) {
      alert.trigger('error', 'Class is full!')
      return
    }
    await updateDoc(classDocRef, {
      students: arrayUnion(childName),
    }).catch((error) => {
      alert.trigger('error', 'Error enrolling in class!')
    })

    const registrationDocRef = doc(
      db,
      'registrationsSpring24',
      selectedStudentUid,
    )
    await updateDoc(registrationDocRef, {
      classes: arrayUnion(classId),
    })
      .then(() => {
        alert.trigger('success', 'Enrolled in class!')
        dialogEl.close()
      })
      .catch((error) => {
        alert.trigger('error', 'Error enrolling in class!')
      })
  }

  async function unenrollFromClass(classId: string): Promise<void> {
    const classDocRef = doc(db, 'classesSpring24', classId)
    await updateDoc(classDocRef, {
      students: arrayRemove(childName),
    }).catch((error) => {
      alert.trigger('error', 'Error unenrolling from class!')
    })

    const registrationDocRef = doc(
      db,
      'registrationsSpring24',
      selectedStudentUid,
    )
    await updateDoc(registrationDocRef, {
      classes: arrayRemove(classId),
    })
      .then(() => {
        alert.trigger('success', 'Unenrolled from class!')
        dialogEl.close()
      })
      .catch((error) => {
        alert.trigger('error', 'Error unenrolling from class!')
      })
  }
</script>

<svelte:head>
  <title>Classes Overview</title>
</svelte:head>

<Dialog bind:this={dialogEl} initial={dialogClassDetails !== null} size="min">
  <svelte:fragment slot="title">Class Details</svelte:fragment>

  <div slot="description" class="space-y-4 p-4">
    {#if dialogClassDetails !== null}
      <h2 class="text-2xl font-bold text-gray-800">
        {dialogClassDetails.course}
      </h2>
      <p class="text-lg font-medium text-gray-700">
        Instructor: {`${dialogClassDetails.instructorFirstName} ${dialogClassDetails.instructorLastName}`}
      </p>
      <div>
        <h4 class="font-semibold text-gray-700">Class Times:</h4>
        <ul class="list-inside list-disc text-gray-600">
          {#each formatClassTimes(dialogClassDetails.classDays, dialogClassDetails.classTimes) as classTime}
            <li>{classTime}</li>
          {/each}
        </ul>
      </div>
      <div class="mt-2">
        <span
          class="inline-block rounded-full px-3 py-1 text-sm font-semibold text-white {dialogClassDetails.spotsRemaining <=
          0
            ? 'bg-red-600'
            : 'bg-green-600'}"
        >
          {dialogClassDetails.spotsRemaining <= 0
            ? 'Class Full'
            : `${dialogClassDetails.spotsRemaining} spots remaining`}
        </span>
      </div>
      {#if isStudent}
        <div class="mt-2 flex items-center gap-2">
          <StudentSelect
            bind:selectedStudent={childName}
            bind:selectedStudentUid
          />
          <Button
            color={isEnrolled(dialogClassDetails.id, selectedStudentUid)
              ? 'red'
              : 'blue'}
            on:click={() => {
              if (dialogClassDetails) {
                toggleEnrollment(dialogClassDetails.id)
              }
            }}
          >
            {isEnrolled(dialogClassDetails.id, selectedStudentUid)
              ? 'Unenroll'
              : 'Enroll'}
          </Button>
        </div>
      {/if}
    {/if}

    <DialogActions>
      <Button on:click={dialogEl.cancel}>Close</Button>
    </DialogActions>
  </div>
</Dialog>

<div>
  {#if loading}
    <Loading />
  {:else}
    <div class="grid gap-6 md:grid-cols-2" transition:fade={{ duration: 500 }}>
      {#each classes as classInfo (classInfo.id)}
        <Card
          class="space-y-4 rounded-lg border border-gray-300 bg-white p-4 shadow-md"
        >
          <h2 class="text-2xl font-bold text-gray-800">{classInfo.course}</h2>
          <p class="text-lg font-medium text-gray-700">
            Instructor: {`${classInfo.instructorFirstName} ${classInfo.instructorLastName}`}
          </p>
          <div>
            <h4 class="font-semibold text-gray-700">Class Times:</h4>
            <ul class="list-inside list-disc text-gray-600">
              {#each formatClassTimes(classInfo.classDays, classInfo.classTimes) as classTime}
                <li>{classTime}</li>
              {/each}
            </ul>
          </div>
          <Button
            class="mt-2"
            color="blue"
            on:click={() => (dialogClassDetails = classInfo)}
          >
            View class details
          </Button>
          {#if Object.entries(studentUidToClassIds).some( ([studentUid, classIds]) => classIds.includes(classInfo.id), )}
            <div class="mt-2">
              <h4 class="font-semibold text-gray-700">
                Your Enrolled Students:
              </h4>
              <ul class="ml-4 list-inside list-disc text-gray-600">
                {#each Object.entries(studentUidToClassIds) as [studentUid, classIds]}
                  {#if classIds.includes(classInfo.id)}
                    <li>{uidToName[studentUid]}</li>
                  {/if}
                {/each}
              </ul>
            </div>
          {/if}

          <div class="mt-2 text-right">
            <span
              class="inline-block rounded-full px-3 py-1 text-sm font-semibold text-white {classInfo.spotsRemaining <=
              0
                ? 'bg-red-600'
                : 'bg-green-600'}"
            >
              {classInfo.spotsRemaining <= 0
                ? 'Class Full'
                : `${classInfo.spotsRemaining} spots remaining`}
            </span>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* Add your styles here */
</style>
