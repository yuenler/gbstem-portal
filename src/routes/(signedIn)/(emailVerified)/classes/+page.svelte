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
  import Select from '$lib/components/Select.svelte'
  import coursesJson from '$lib/data/courses.json'
  import Alert from '$lib/components/Alert.svelte'
  import { formatTime24to12 } from '$lib/utils'
    import { classesCollection, registrationsCollection } from '$lib/data/constants'

  type ClassInfo = {
    id: string
    className: string
    classDays: string[]
    classTimes: string[]
    course: string
    instructorFirstName: string
    instructorLastName: string
    instructorEmail: string
    spotsRemaining: number
    meetingLink: string
    gradeRecommendation: string
    online: boolean
  }

  let classes: ClassInfo[] = []
  let loading = true
  let dialogEl: Dialog
  let dialogClassDetails: ClassInfo | null = null
  let selectedStudentUid = ''
  let userEmail = ''
  let userName = ''

  let classFilter = ''
  let onlyShowEnrolled = false

  const studentUidToClassIds: {
    [studentUid: string]: string[]
  } = {}

  const studentUidToGrade: Record<string, string> = {}

  const uidToName: Record<string, string> = {}

  const courseToMinGrade = {
    'Environmental Science': 5,
    'Python I': 3,
    'Web Development': 5,
    'Python II': 5,
    'Mathematics 2a': 1,
    'Mathematics 3a': 3,
    'Mathematics 4a': 5,
    'Mathematics 5a': 6,
    'Engineering I': 2,
    'Engineering II': 4,
    'Engineering III': 5,
  }

  let isStudent = true

  const determineStudentEnrollment = async (user: Data.User.Store) => {
    const uid = user.object.uid
    for (let i = 1; i < 6; ++i) {
      const docRef = await getDoc(
        doc(db, registrationsCollection, `${uid}-${i}`),
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
        studentUidToGrade[studentUid] = docRef.data()?.academic.grade ?? ''
      }
    }
  }

  const getData = () => {
    return user.subscribe(async (user) => {
      if (user?.profile.role === 'instructor') {
        isStudent = false
      }
      const classesCollectionRef = collection(db, classesCollection)
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
          instructorEmail: data.instructorEmail,
          spotsRemaining: data.students
            ? data.classCap - data.students.length
            : data.classCap,
          meetingLink: data.meetingLink,
          gradeRecommendation: data.gradeRecommendation,
          online: data.online,
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
      // sort classes so that classes with most spots remaining are at the top
      classes.sort((a, b) => b.spotsRemaining - a.spotsRemaining)

      if (user && isStudent) {
        if (user.object.email) userEmail = user.object.email
        if (user.object.displayName)
          (userName = user.profile.firstName),
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
    const classDocRef = doc(db, classesCollection, classId)
    // get updated number of students in the class
    const classDoc = await getDoc(classDocRef)
    const classData = classDoc.data()
    const numStudents = classData?.students?.length ?? 0
    if (numStudents >= classData?.classCap) {
      alert.trigger('error', 'Class is full!')
      return
    }

    // throw alert if student attempts to enroll in more than 2 classes
    if (studentUidToClassIds[selectedStudentUid].length >= 2) {
      alert.trigger(
        'error',
        'Each student may only enroll in a maximum of 2 classes!',
      )
      return
    }

    const ageLimitsDoc = await getDoc(
      doc(db, registrationsCollection, selectedStudentUid),
    )
    const ageBypassEnabled = ageLimitsDoc.data()?.agreements.bypassAgeLimits

    if (!ageBypassEnabled) {
      if (
        dialogClassDetails &&
        Object.keys(courseToMinGrade).includes(dialogClassDetails.course) &&
        (studentUidToGrade[selectedStudentUid] == 'K' ||
          parseInt(studentUidToGrade[selectedStudentUid], 10) <
            courseToMinGrade[dialogClassDetails.course ?? ''])
      ) {
        alert.trigger(
          'error',
          `Students must be in grade ${
            courseToMinGrade[dialogClassDetails.course ?? '']
          } or higher to enroll in this class!`,
        )
        return
      }
    }

    await updateDoc(classDocRef, {
      students: arrayUnion(selectedStudentUid),
    }).catch((error) => {
      alert.trigger('error', 'Error enrolling in class!')
    })

    const registrationDocRef = doc(
      db,
      registrationsCollection,
      selectedStudentUid,
    )
    await updateDoc(registrationDocRef, {
      classes: arrayUnion(classId),
    })
      .then(() => {
        alert.trigger('success', 'Enrolled in class!')
        fetch('/api/enroll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail,
            firstName: userName,
            instructor: dialogClassDetails?.instructorFirstName,
            instructorEmail: dialogClassDetails?.instructorEmail,
            classTimes: dialogClassDetails?.classTimes,
            classDays: dialogClassDetails?.classDays,
            course: dialogClassDetails?.course,
            meetingLink: dialogClassDetails?.meetingLink,
            online: dialogClassDetails?.online,
            studentName: uidToName[selectedStudentUid],
          }),
        }).then(async (res) => {
          if (!res.ok) {
            const { message } = await res.json()
            console.log(message)
          }
          dialogEl.close()
          window.scrollTo({
            top: 0,
            behavior: 'smooth',
          })
        })
        alert.trigger(
          'success',
          'Thank you for enrolling! You will receive an email confirming course details shortly.',
        )
      })
      .catch((error) => {
        alert.trigger('error', 'Error enrolling in class!')
      })
  }

  async function unenrollFromClass(classId: string): Promise<void> {
    const classDocRef = doc(db, classesCollection, classId)
    await updateDoc(classDocRef, {
      students: arrayRemove(selectedStudentUid),
    }).catch((error) => {
      alert.trigger('error', 'Error unenrolling from class!')
    })

    const registrationDocRef = doc(
      db,
      registrationsCollection,
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
        <span
          >{dialogClassDetails.gradeRecommendation
            ? ` (Grades ${dialogClassDetails.gradeRecommendation})`
            : ''}</span
        >
      </h2>
      <p class="text-lg font-medium text-gray-700">
        {dialogClassDetails.online
          ? `Online`
          : `In-Person (Cambridge Public Library Main Branch)`}
      </p>
      <p class="text-lg font-medium text-gray-700">
        Instructor: {`${dialogClassDetails.instructorFirstName} ${dialogClassDetails.instructorLastName}`}
      </p>
      <div>
        <h4 class="font-semibold text-gray-700">
          {`Class Times (${
            dialogClassDetails.online ? '1-hour classes' : '2-hour class'
          }):`}
        </h4>
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
          <StudentSelect bind:selectedStudentUid />
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
    <div class="mb-5 flex items-center justify-between">
      <Select
        bind:value={classFilter}
        placeholder="Filter by course"
        options={coursesJson}
      />
      {#if isStudent}
        <Button
          color={onlyShowEnrolled ? 'blue' : 'gray'}
          on:click={() => (onlyShowEnrolled = !onlyShowEnrolled)}
        >
          {onlyShowEnrolled ? 'Show all classes' : 'Show only enrolled classes'}
        </Button>
      {/if}
    </div>

    <div class="grid gap-6 md:grid-cols-2" transition:fade={{ duration: 500 }}>
      {#each classes as classInfo (classInfo.id)}
        {#if classFilter == '' || classFilter == classInfo.course}
          {#if !onlyShowEnrolled || Object.entries(studentUidToClassIds).some( ([studentUid, classIds]) => classIds.includes(classInfo.id), )}
            <Card
              class="space-y-4 rounded-lg border border-gray-300 bg-white p-4 shadow-md"
            >
              <h2 class="text-2xl font-bold text-gray-800">
                {classInfo.course}

                <span
                  >{classInfo.gradeRecommendation
                    ? ` (Grades ${classInfo.gradeRecommendation})`
                    : ''}</span
                >
              </h2>
              <p class="text-lg font-medium text-gray-700">
                {classInfo.online
                  ? `Online`
                  : `In-Person (Cambridge Public Library Main Branch)`}
              </p>
              <p class="text-lg font-medium text-gray-700">
                Instructor: {`${classInfo.instructorFirstName} ${classInfo.instructorLastName}`}
              </p>
              <div>
                <h4 class="font-semibold text-gray-700">
                  {`Class Times (${
                    classInfo.online ? '1-hour classes' : '2-hour class'
                  }):`}
                </h4>
                <ul class="list-inside list-disc text-gray-600">
                  {#each formatClassTimes(classInfo.classDays, classInfo.classTimes) as classTime}
                    <li>{classTime}</li>
                  {/each}
                </ul>
              </div>
              {#if isStudent}
              <Button
                class="mt-2"
                color="blue"
                on:click={() => (dialogClassDetails = classInfo)}
              >
                Add/Drop class
              </Button>
              {/if}
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
                  <!-- display meeting link -->
                  <div class="mt-2 flex items-center">
                    <h4 class="font-semibold text-gray-700">
                      Meeting Location:
                    </h4>
                    <a
                      href={classInfo.meetingLink}
                      target="_blank"
                      rel="noopener"
                      class="ml-2 text-blue-500 underline"
                      >{classInfo.meetingLink}</a
                    >
                  </div>

                  <div class="mt-2 flex items-center">
                    <h4 class="font-semibold text-gray-700">
                      Instructor email:
                    </h4>
                    <a
                      href={`mailto:${classInfo.instructorEmail}`}
                      class="ml-2 text-blue-500 underline"
                      >{classInfo.instructorEmail}</a
                    >
                  </div>
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
          {/if}
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  /* Add your styles here */
</style>
