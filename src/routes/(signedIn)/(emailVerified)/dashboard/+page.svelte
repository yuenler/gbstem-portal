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
  import InterviewForm from '$lib/components/forms/InterviewForm.svelte'
  import { getDoc, doc, collection, getDocs, query } from 'firebase/firestore'
  import { fade } from 'svelte/transition'
  import StudentFeedbackForm from '$lib/components/forms/StudentFeedbackForm.svelte'
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
<div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 py-8 px-2 md:px-8">
  {#if loading}
    <Loading class="col-span-2 h-96 flex items-center justify-center" />
  {:else}
    <div class="flex flex-col gap-8">
      {#if $user?.profile?.role === 'instructor' && new Date() >= new Date(semesterDates.classesStart) && data.application.status === 'submitted'}
        <Card class="p-6 bg-white shadow-lg rounded-xl">
          <div class="flex items-center mb-4">
            <svg class="h-6 w-6 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01" />
            </svg>
            <h2 class="text-xl font-bold text-gray-900">Application Received</h2>
          </div>
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-2">
            Your instructor application was submitted after the deadline. Applications are now closed for this semester. We will keep your application on file and notify you about future opportunities.
          </div>
        </Card>
      {/if}
      {#if isStudent}
        <Card class="p-6 bg-white shadow-lg rounded-xl">
          <div class="flex items-center mb-4">
            <svg class="h-6 w-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 class="text-xl font-bold text-gray-900">Your Students</h2>
          </div>
          <div class="mb-4">
            <StudentSelect />
          </div>
          <div class="flex flex-col gap-2">
            <a href="/apply">
              <Button class="w-full flex items-center justify-center gap-2" color="blue">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create or View A Student Account
              </Button>
            </a>
          </div>
        </Card>
        <Card class="p-6 bg-white shadow-lg rounded-xl">
          <div class="flex items-center mb-4">
            <svg class="h-6 w-6 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 class="text-xl font-bold text-gray-900">Class Feedback</h2>
          </div>
          <StudentFeedbackForm />
        </Card>
      {/if}
      <!-- Application & Registration Section (conditionally rendered) -->
      {#if (new Date() < new Date(semesterDates.classesStart)) || ((new Date() >= new Date(semesterDates.classesStart)) && ((!isStudent && data.application.status !== 'accepted') || (isStudent && numSubmitted === 0)))}
        <Card class="p-6 bg-white shadow-lg rounded-xl">
          <div class="flex items-center mb-4">
            <svg class="h-6 w-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 014-4h3m4 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 class="text-xl font-bold text-gray-900">Application & Registration</h2>
          </div>
          {#if (new Date() < new Date(semesterDates.classesStart)) || ((new Date() >= new Date(semesterDates.classesStart)) && ((!isStudent && data.application.status !== 'accepted') ))}
            {#if !isStudent}
              <div class="mb-4">
                <h3 class="text-lg font-semibold">Instructor Application</h3>
                {#if data.application.status === null}
                  <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-2 flex items-center">
                    <svg class="h-5 w-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01" />
                    </svg>
                    <span>Applications to be an instructor are due <span class="font-bold">{new Date(semesterDates.newInstructorAppsDue).toDateString()}</span> at 11:59 PM ET.</span>
                  </div>
                {/if}
                <div class="mb-2">
                  <p>
                    {#if data.application.status === 'accepted'}
                      <span class="text-green-700 font-semibold">You have been accepted to gbSTEM as an instructor! We look forward to seeing you.</span>
                    {:else if data.application.status === 'waitlisted'}
                      <span class="text-yellow-700 font-semibold">You have been waitlisted. We will follow up with more information!</span>
                    {:else if data.application.status === 'rejected'}
                      <span class="text-red-700 font-semibold">Unfortunately, instructor applications were extremely competitive, and we were not able to accept you as an instructor for gbSTEM.</span>
                    {:else if data.application.status === 'submitted' || data.application.status === 'interview'}
                      <span class="text-blue-700 font-semibold">Your application is submitted and in review!</span>
                    {:else if data.application.status === 'substitute'}
                      <span class="text-blue-700 font-semibold">You have been accepted as a substitute instructor. Keep an eye on this page for listings!</span>
                    {:else}
                      <span>Your application is in progress. Make sure to submit by the deadline!</span>
                    {/if}
                  </p>
                </div>
                <div class="rounded-lg bg-green-100 p-4 mt-2 text-green-900">gbSTEM is offering a Lego Robotics Competition program for the spring. Sessions will be held in person weekly on Saturdays 1-3 pm at the Cambridge Public Library. Instructors will get the chance to mentor students in design, robotics coding, and Lego engineering as well as strategy and gameplay. Learn more <a class="underline" href='www.gbstem.org/#/robotics'>here</a>.</div>
                <a href="/apply">
                  <Button class="mt-5 w-full flex items-center justify-center gap-2" color="blue">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    View Application
                  </Button>
                </a>
              </div>
            {:else}
              <div class="mb-4">
                <h3 class="text-lg font-semibold">Student Registration</h3>
                <div class="rounded-lg bg-green-100 p-4 mt-2 text-green-900">NEW COURSE: gbSTEM is now offering a Lego Robotics Competition program. Sessions will be held in person weekly on Saturdays at the Cambridge Public Library. Students enrolled will get the chance to work together to build a robot to solve mission puzzles. Learn more <a class="underline" href='www.gbstem.org/#/robotics'>here</a>.</div>
                {#if numSubmitted > 0}
                  <div class="mt-2 text-blue-700 font-semibold">You currently have {numSubmitted} student{numSubmitted > 1 ? 's' : ''} with accounts for this semester.</div>
                {:else}
                  <div class="mt-2 text-red-700 font-semibold">You have no student accounts set up for this semester.</div>
                {/if}
                <a href="/apply">
                  <Button class="mt-5 w-full flex items-center justify-center gap-2" color="blue">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create or View A Student Account
                  </Button>
                </a>
              </div>
            {/if}
          {:else if (new Date() >= new Date(semesterDates.classesStart)) && ((!isStudent && data.application.status === null) || (isStudent && numSubmitted === 0))}
            <div class="mb-4">
              <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-2 flex items-center">
                <svg class="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-1.414 1.414A9 9 0 103 12.001V13a9 9 0 0015.95 6.364l1.414-1.414A11 11 0 1112 1a11 11 0 016.364 4.636z" />
                </svg>
                <span>
                  {#if !isStudent}
                    The instructor application deadline has passed. Applications were due <span class="font-bold">{new Date(semesterDates.newInstructorAppsDue).toDateString()}</span> at 11:59 PM ET. Unfortunately, you cannot apply to be an instructor for this semester. Please check back for future opportunities.
                  {:else}
                    The student registration deadline has passed. Registrations were due <span class="font-bold">{new Date(semesterDates.registrationsDue).toDateString()}</span> at 11:59 PM ET. Unfortunately, you cannot register students for this semester. Please check back for future opportunities.
                  {/if}
                </span>
              </div>
            </div>
          {/if}
        </Card>
      {/if}
      {#if data.application.status === 'accepted'}
        <Card class="p-6 bg-white shadow-lg rounded-xl">
          <div class="flex items-center mb-4">
            <svg class="h-6 w-6 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 014-4h3m4 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 class="text-xl font-bold text-gray-900">Your Classes</h2>
          </div>
          <!-- Show ClassSchedule only after orientation -->
          {#if Date.now() > new Date(semesterDates.instructorOrientation).getTime()}
            <ClassSchedule semesterDates={semesterDates}/>
          {/if}
          <SubClasses subInstructor={false} />
        </Card>
      {:else if data.application.status === 'substitute'}
        <Card class="p-6 bg-white shadow-lg rounded-xl">
          <div class="flex items-center mb-4">
            <svg class="h-6 w-6 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 014-4h3m4 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 class="text-xl font-bold text-gray-900">Substitute Classes</h2>
          </div>
          <SubClasses subInstructor={true}/>
        </Card>
      {/if}
      {#if data.application.status === 'interview'}
        <Card class="p-6 bg-white shadow-lg rounded-xl">
          <div class="flex items-center mb-4">
            <svg class="h-6 w-6 text-pink-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 class="text-xl font-bold text-gray-900">Interview</h2>
          </div>
          <InterviewForm semesterDates={semesterDates}/>
        </Card>
      {/if}
    
    </div>
    <div class="flex flex-col gap-8">
      <!-- Class Details Form for accepted instructors (moved to right column) -->
      {#if data.application.status === 'accepted'}
        <Card class="p-6 bg-white shadow-lg rounded-xl">
          <div class="flex items-center mb-4">
            <svg class="h-6 w-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 class="text-xl font-bold text-gray-900">Class Details</h2>
          </div>
          <ClassDetailsForm semesterDates={semesterDates} dialog={false} classDetailsDialogEl={undefined} />
        </Card>
      {/if}
       <!-- Student Schedule Section -->
       {#if isStudent && new Date() > new Date(semesterDates.studentOrientation)}
       <Card class="p-6 bg-white shadow-lg rounded-xl">
         <div class="flex items-center mb-4">
           <svg class="h-6 w-6 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
           </svg>
           <h2 class="text-xl font-bold text-gray-900">Student Schedule</h2>
         </div>
         <StudentSchedule />
       </Card>
     {/if}
    </div>
  {/if}
</div>
