<script lang="ts">
  import { db, user } from '$lib/client/firebase'
  import Card from '$lib/components/Card.svelte'
  import ClassSchedule from '$lib/components/ClassSchedule.svelte'
  import Link from '$lib/components/Link.svelte'
  import Loading from '$lib/components/Loading.svelte'
  import PageLayout from '$lib/components/PageLayout.svelte'
  import StudentSchedule from '$lib/components/StudentSchedule.svelte'
  import ClassDetailsForm from '$lib/components/forms/ClassDetailsForm.svelte'
  import is from 'date-fns/locale/is'
  import ConfirmationForm from '$lib/components/forms/ConfirmationForm.svelte'
  import InterviewForm from '$lib/components/forms/InterviewForm.svelte'
  import { getDoc, doc, collection, getDocs, query } from 'firebase/firestore'
  import { fade } from 'svelte/transition'
  import StudentFeedbackForm from '$lib/components/forms/StudentFeedbackForm.svelte'
  import InstructorFeedbackForm from '$lib/components/forms/InstructorFeedbackForm.svelte'
  import Button from '$lib/components/Button.svelte'
  import { applicationsCollection, decisionsCollection, registrationsCollection, semesterDatesDocument } from '$lib/data/constants'
  import SubClasses from '$lib/components/SubClasses.svelte'
  import StudentSelect from '$lib/components/StudentSelect.svelte'

  type ApplicationStatus =
    | 'accepted'
    | 'waitlisted'
    | 'rejected'
    | 'submitted'
    | 'interview'
    | 'substitute'
    | null

  type DashboardData = {
    application: {
      status: ApplicationStatus
    }
  }

  let loading = true
  let numSubmitted = 0

  let data: DashboardData = {
    application: {
      status: null,
    },
  }

  let semesterDates: Data.SemesterDates = {
    classesEnd: '',
    classesStart: '',
    leadershipAppsDue: '',
    newInstructorAppsDue: '',
    returningInstructorAppsDue: '',
    instructorOrientation: '',
    newInstructorAppsOpen: '',
    returningInstructorAppsOpen: '',
    studentOrientation: '',
    registrationsDue: '',
    parentOrientation: '',
  }

  let isStudent = false

  user.subscribe((user) => {
    if (user) {
      isStudent = user.profile.role === 'student'
      let timer: number
      getDoc(doc(db, 'semesterDates', semesterDatesDocument)).then((datesDoc) => {
        const datesDocExists = datesDoc.exists()
        if (datesDocExists) {
          semesterDates = datesDoc.data() as Data.SemesterDates
        }
      })
      Promise.all([
        new Promise<void>((resolve) => {
          timer = window.setTimeout(resolve, 400)
        }),
        new Promise<void>((resolve) => {
          if (user.profile.role === 'instructor') {
            getDoc(doc(db, applicationsCollection, user.object.uid)).then(
              (applicationDoc) => {
                const applicationExists = applicationDoc.exists()
                if (applicationExists) {
                  const applicationData =
                    applicationDoc.data() as Data.Application
                  if (applicationData.meta.submitted) {
                    data.application.status = 'submitted'
                    getDoc(doc(db, decisionsCollection, user.object.uid)).then(
                      (snapshot) => {
                        if (snapshot.exists()) {
                          data.application.status = snapshot.data()
                            .type as Data.Decision
                        }
                        resolve()
                      },
                    )
                  } else {
                    data.application.status = null
                  }
                }
                resolve()
              },
            )
          } else {
            const q = query(collection(db, registrationsCollection))
            getDocs(q).then((querySnapshot) => {
              querySnapshot.forEach((doc) => {
                const id = doc.id
                if (id.includes(user.object.uid)) {
                  if (doc.data().meta.submitted) {
                    numSubmitted += 1
                  }
                }
              })
              resolve()
            })
          }
        }),
      ]).then(() => {
        loading = false
      })
      return () => window.clearTimeout(timer)
    }
  })
</script>

<svelte:head>
  <title>Dashboard</title>
</svelte:head>
  <div class="grid md:grid-cols-2 gap-2">
    {#if loading}
      <Loading
        class="absolute left-0 right-0 top-0 h-[calc(100vh-216px-80px)] md:h-[calc(100vh-216px)]"
      />
    {:else}
      <div
        class="space-y-6"
        transition:fade={{
          duration: 500,
        }}
      >
      {#if isStudent}
        <StudentSelect/>
      {/if}

      {#if new Date() < new Date(semesterDates.classesStart)}
      <Card class="space-y-2">
        <h2 class="text-xl font-bold">Application</h2>
        {#if !isStudent}
          {#if data.application.status === null}
            <div class="space-y-1">
              <p>
                Applications to be an instructor are due <span
                  class="font-bold"
                >
                 {new Date(semesterDates.newInstructorAppsDue).toDateString()}
                </span>
                at 11:59 PM ET.
              </p>
            </div>
          {/if}
          <div class="space-y-1">
            <p>
              {#if data.application.status === 'accepted'}
                You have been accepted to gbSTEM as an instructor! We look
                forward to seeing you.
              {:else if data.application.status === 'waitlisted'}
                You have been waitlisted. We will follow up with more
                information!
              {:else if data.application.status === 'rejected'}
                Unfortunately, instructor applications were extremely
                competitive, and we were not able to accept you as an instructor
                for gbSTEM.
              {:else if data.application.status === 'submitted' || data.application.status === 'interview'}
                Your application is submitted and in review!
              {:else if data.application.status === 'substitute'}
                You have been accepted as a substitute instructor. Keep an eye on this page for listings!
              {:else}
                Your application is in progress. Make sure to submit by the
                deadline!
              {/if}
            </p>
            <div class="rounded-lg bg-green-100 p-4 mt-2">NEW COURSE: gbSTEM is now offering a Lego Robotics Competition program for the fall. Sessions will be held in person weekly on Saturdays at the Cambridge Public Library. Instructors will get the chance to mentor students in design, robotics coding, and Lego engineering as well as strategy and gameplay. Learn more <a class="underline" href='www.gbstem.org/#/robotics'>here</a>.</div>
            <a href="/apply">
              <Button class="mt-5">View Application</Button>
            </a>
          </div>
        {:else}
          <p>
            Registrations to be a student are due
            <span class="font-bold"> {new Date(semesterDates.registrationsDue).toDateString()} </span> at 11:59 PM ET. Be sure
            you have registered each student by the deadline!
          </p>
          <div class="flex items-center justify-between rounded-lg bg-red-100 p-4 mt-2">NOTICE: gbSTEM is bumping up the minimum grade requirement to 1st grade. We have found that at this age, students are more able to gain a meaningful experience out of our classes.</div>
          <div class="rounded-lg bg-green-100 p-4 mt-2">NEW COURSE: gbSTEM is now offering a Lego Robotics Competition program. Sessions will be held in person weekly on Saturdays at the Cambridge Public Library. Students enrolled will get the chance to work together to build a robot and compete in an international competition. Learn more <a class="underline" href='www.gbstem.org/#/robotics'>here</a>.</div>
          {#if numSubmitted > 0}
            <p>
              You currently have {numSubmitted} student{numSubmitted > 1
                ? 's'
                : ''}{' '} registered for this semester.
            </p>
          {:else}
            <p>
              You have not yet registered any students for this semester.
            </p>
          {/if}
          <div>
            <a href="/apply">
              <Button class="mt-5">View Registration Form</Button>
            </a>
          </div>
        {/if}
      </Card>
      {/if}
      
      {#if data.application.status === 'accepted'}
        <ClassDetailsForm semesterDates = {semesterDates} classDetailsDialogEl={undefined} dialog={false}/>
          <SubClasses subInstructor={false} />
      {:else if data.application.status === 'substitute'}
          <SubClasses subInstructor={true}/>
      {:else if isStudent && new Date() > new Date(semesterDates.classesStart)}
        <StudentSchedule />
      {/if}
      <div>
        {#if data.application.status === 'interview'}
          <InterviewForm semesterDates = {semesterDates}/>
        {/if}
      </div>
     </div>
     <div>
     {#if isStudent && new Date() > new Date(semesterDates.classesStart)}
        <StudentFeedbackForm />
      {/if}
        {#if data.application.status === 'accepted'}
          {#if Date.now() > new Date(semesterDates.classesStart).getTime()}
            <ClassSchedule semesterDates={semesterDates}/>
          {/if}
        {/if}
      </div>
    {/if}
  </div>
