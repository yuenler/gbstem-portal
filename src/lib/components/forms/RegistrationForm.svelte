<script lang="ts">
  import clsx from 'clsx'
  import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    Timestamp,
    deleteDoc,
  } from 'firebase/firestore'
  import Input from '$lib/components/Input.svelte'
  import Select from '$lib/components/Select.svelte'
  import {
    gendersJson,
    reasonsJson,
    raceJson,
    mathCoursesJson,
    frlpJson,
    parentEducationJson,
    csCoursesJson,
    engineeringCoursesJson,
    scienceCoursesJson,
    gradesJson,
  } from '$lib/data'
  import { alert } from '$lib/stores'
  import { onDestroy, onMount } from 'svelte'
  import Card from '$lib/components/Card.svelte'
  import Form from '$lib/components/Form.svelte'
  import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
  import { db, storage, user } from '$lib/client/firebase'
  import { cloneDeep, isEqual } from 'lodash-es'
  import Link from '../Link.svelte'
  import Button from '../Button.svelte'
    import { registrationsCollection } from '$lib/data/constants'

  export let childUid: string = ''

  export let semesterDates: Data.SemesterDates = {
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

  let disabled = true
  let showValidation = false
  let dbValues: Data.Registration

  const emptyValues: Data.Registration = {
    personal: {
      email: '',
      studentFirstName: '',
      studentLastName: '',
      parentFirstName: '',
      parentLastName: '',
      gender: '',
      race: [],
      phoneNumber: '',
      dateOfBirth: '',
      frlp: '',
      parentEducation: '',
      secondaryEmail: '',
    },
    academic: {
      school: '',
      grade: '',
    },
    program: {
      csCourse: '',
      engineeringCourse: '',
      mathCourse: '',
      scienceCourse: '',
      inPerson: false,
      reason: '',
    },
    inPerson: {
      allergies: '',
      parentPickup: '',
    },
    agreements: {
      bypassAgeLimits: false,
      entireProgram: false,
      timeCommitment: false,
      mediaRelease: false,
      submitting: false,
    },
    meta: {
      id: '',
      uid: '',
      submitted: false,
    },
    timestamps: {
      created: serverTimestamp() as Timestamp,
      updated: serverTimestamp() as Timestamp,
    },
  }

  let values: Data.Registration = {
    personal: {
      email: '',
      studentFirstName: '',
      studentLastName: '',
      parentFirstName: '',
      parentLastName: '',
      gender: '',
      race: [],
      phoneNumber: '',
      dateOfBirth: '',
      frlp: '',
      parentEducation: '',
      secondaryEmail: '',
    },
    academic: {
      school: '',
      grade: '',
    },
    program: {
      csCourse: '',
      engineeringCourse: '',
      mathCourse: '',
      scienceCourse: '',
      inPerson: false,
      reason: '',
    },
    inPerson: {
      allergies: '',
      parentPickup: '',
    },
    agreements: {
      bypassAgeLimits: false,
      entireProgram: false,
      timeCommitment: false,
      mediaRelease: false,
      submitting: false,
    },
    meta: {
      id: '',
      uid: '',
      submitted: false,
    },
    timestamps: {
      created: serverTimestamp() as Timestamp,
      updated: serverTimestamp() as Timestamp,
    },
  }

  let saveInterval: number | undefined = undefined

  const initializeForm = () => {
    disabled = true
    return user.subscribe((user) => {
      if (user) {
        getDoc(doc(db, registrationsCollection, childUid)).then(
          (applicationDoc) => {
            const applicationExists = applicationDoc.exists()
            if (applicationExists) {
              const applicationData = applicationDoc.data() as Data.Registration
              values = cloneDeep(applicationData)
              dbValues = cloneDeep(applicationData)
              if (
                !values.meta.submitted &&
                (values.personal.parentFirstName !== user.profile.firstName ||
                  values.personal.parentLastName !== user.profile.lastName)
              ) {
                values.personal.email = user.object.email as string
                values.personal.parentFirstName = user.profile.firstName
                values.personal.parentLastName = user.profile.lastName
                handleSave()
              }
            } else {
              values = cloneDeep(emptyValues)
              values.meta.uid = childUid
              values.meta.id = user.profile.id
              values.personal.email = user.object.email as string
              values.personal.parentFirstName = user.profile.firstName
              values.personal.parentLastName = user.profile.lastName
              handleSave()
            }
            if (new Date() > new Date(semesterDates.newInstructorAppsOpen)) {
              disabled = false
              if (saveInterval === undefined) {
                saveInterval = window.setInterval(() => {
                  handleSave()
                }, 300000)
              }
            }
          },
        )
      }
   })
  }

  onMount(() => initializeForm())
  $: if (childUid) {
    initializeForm()
  }

  onDestroy(() => {
    clearInterval(saveInterval)
    saveInterval = undefined
  })
  function modifiedValues() {
    return {
      ...values,
      timestamps: {
        ...values.timestamps,
        updated: serverTimestamp(),
      },
    }
  }

  function handleDelete() {
    if ($user) {
      if (confirm('Are you sure you want to delete this draft?')) {
        deleteDoc(doc(db, registrationsCollection, childUid))
          .then(() => {
            alert.trigger('success', 'Draft was successfully deleted.')
            location.reload()
          })
          .catch((err) => {
            alert.trigger('error', err.code, true)
          })
      }
    }
  }

  function handleSave(disable: boolean = false) {
    if (!disabled) {
      showValidation = false
      if (disable) {
        disabled = true
      }
      return new Promise<void>((resolve, reject) => {
        if ($user) {
          setDoc(doc(db, registrationsCollection, childUid), modifiedValues())
            .then(() => {
              getDoc(doc(db, registrationsCollection, childUid)).then(
                (applicationDoc) => {
                  const applicationData =
                    applicationDoc.data() as Data.Registration
                  values = cloneDeep(applicationData)
                  dbValues = cloneDeep(applicationData)
                  if (disable) {
                    disabled = false
                  }
                  alert.trigger('success', 'Your progress was saved.')
                  resolve()
                },
              )
            })
            .catch((err) => {
              if (disable) {
                disabled = false
              }
              console.log(err)
              alert.trigger('error', err.code, true)
              reject()
            })
        }
      })
    }
  }

  function customErrors() {
    const selectedCS = values.program.csCourse.startsWith('I am not') ? 0 : 1
    const selectedMath = values.program.mathCourse.startsWith('I am not')
      ? 0
      : 1
    const selectedEngineering = values.program.engineeringCourse.startsWith(
      'I am not',
    )
      ? 0
      : 1
    const selectedScience = values.program.scienceCourse.startsWith('I am not')
      ? 0
      : 1

    if (selectedCS + selectedMath + selectedEngineering + selectedScience > 2) {
      alert.trigger('error', 'You can only select up to 2 courses.', false)
      return true
    } else if (
      selectedCS + selectedMath + selectedEngineering + selectedScience ==
      0
    ) {
      alert.trigger('error', 'You must select at least 1 course.', false)
      return true
    }

    // check if the user has selected more timeslots than number of courses
    const numClasses =
      selectedCS + selectedMath + selectedEngineering + selectedScience

    if(!values.agreements.bypassAgeLimits) {
    // if environmental science was selected, make sure that the student is at least in 4 grade or older
    if (
      values.program.scienceCourse === 'Environmental Science' &&
      (parseInt(values.academic.grade) < 5 || values.academic.grade === 'K')
    ) {
      alert.trigger(
        'error',
        'Environmental Science is only available to students in at least 5th grade.',
        false,
      )
      return true
    }

    // if python was selected, make sure that the student is at least in 3rd grade or older
    if (
      values.program.csCourse === 'Python I' &&
      (parseInt(values.academic.grade) < 3 || values.academic.grade === 'K')
    ) {
      alert.trigger(
        'error',
        'Python I is only available to students in at least 3rd grade.',
        false,
      )
      return true
    }

    // if java was selected, make sure that the student is at least in 4th grade or older
    if (
      values.program.csCourse === 'Java' &&
      (parseInt(values.academic.grade) < 5 || values.academic.grade === 'K')
    ) {
      alert.trigger(
        'error',
        'Java is only available to students in at least 5th grade.',
        false,
      )
      return true
    }

    // if web development was selected, make sure that the student is at least in 4th grade or older
    if (
      values.program.csCourse === 'Web Development' &&
      (parseInt(values.academic.grade) < 5 || values.academic.grade === 'K')
    ) {
      alert.trigger(
        'error',
        'Web Development is only available to students in at least 5th grade.',
        false,
      )
      return true
    }

    // if python II was selected, make sure that the student is at least in 5th grade or older
    if (
      values.program.csCourse === 'Python II' &&
      (parseInt(values.academic.grade) < 5 || values.academic.grade === 'K')
    ) {
      alert.trigger(
        'error',
        'Python II is only available to students in at least 5th grade.',
        false,
      )
      return true
    }

    // math I only for 1st grade and up
    if (
      values.program.mathCourse === 'Mathematics 1a' &&
      (parseInt(values.academic.grade) < 1 || values.academic.grade === 'K')
    ) {
      alert.trigger(
        'error',
        'Math I is only available to students in at least 1st grade.',
        false,
      )
      return true
    }

    // math II only for 2nd grade and up
    if (
      values.program.mathCourse === 'Mathematics 2a' &&
      (parseInt(values.academic.grade) < 2 || values.academic.grade === 'K')
    ) {
      alert.trigger(
        'error',
        'Math II is only available to students in at least 2nd grade.',
        false,
      )
      return true
    }

    // math III only for 3rd grade and up
    if (
      values.program.mathCourse === 'Mathematics 3a' &&
      (parseInt(values.academic.grade) < 3 || values.academic.grade === 'K')
    ) {
      alert.trigger(
        'error',
        'Math III is only available to students in at least 3rd grade.',
        false,
      )
      return true
    }

    // math IV only for 4th grade and up
    if (
      values.program.mathCourse === 'Mathematics 4a' &&
      (parseInt(values.academic.grade) < 5 || values.academic.grade === 'K')
    ) {
      alert.trigger(
        'error',
        'Math IV is only available to students in at least 5th grade.',
        false,
      )
      return true
    }

    // math V only for 5th grade and up
    if (
      values.program.mathCourse === 'Mathematics 5a' &&
      (parseInt(values.academic.grade) < 6 || values.academic.grade === 'K')
    ) {
      alert.trigger(
        'error',
        'Math V is only available to students in at least 6th grade.',
        false,
      )
      return true
    }

    // engineering I only for grade 2 and up
    if (
      values.program.engineeringCourse === 'Engineering I' &&
      (parseInt(values.academic.grade) < 2 || values.academic.grade === 'K')
    ) {
      alert.trigger(
        'error',
        'Engineering I is only available to students in at least 2nd grade.',
        false,
      )
      return true
    }

    // engineering II only for grade 4 and up
    if (
      values.program.engineeringCourse === 'Engineering II' &&
      (parseInt(values.academic.grade) < 4 || values.academic.grade === 'K')
    ) {
      alert.trigger(
        'error',
        'Engineering II is only available to students in at least 4th grade.',
        false,
      )
      return true
    }

    // engineering III only for grade 5 and up
    if (
      values.program.engineeringCourse === 'Engineering III' &&
      (parseInt(values.academic.grade) < 5 || values.academic.grade === 'K')
    ) {
      alert.trigger(
        'error',
        'Engineering III is only available to students in at least 5th grade.',
        false,
      )
      return true
    }

    // robotics only for grade 5 and up
    if (
      values.program.inPerson === true &&
      (parseInt(values.academic.grade) < 5 || values.academic.grade === 'K')
    ) {
      alert.trigger(
        'error',
        'Lego Robotics is only available to students in at least 5th grade.',
        false,
      )
      return true
    }
  }

    return false
  }

  function handleSubmit(e: CustomEvent<SubmitData>) {
    if ($user) {
      const frozenUser = $user
      if (e.detail.error === null) {
        if (customErrors()) {
          return
        }
        showValidation = false
        disabled = true
        values.meta.submitted = true
        setDoc(doc(db, registrationsCollection, childUid), modifiedValues())
          .then(() => {
            alert.trigger(
              'success',
              'Your student account has been created!',
            )
            getDoc(doc(db, registrationsCollection, childUid)).then(
              (applicationDoc) => {
                fetch('/api/registration', {
                  method: 'POST',
                  body: JSON.stringify({
                    firstName: frozenUser.profile.firstName,
                    studentName: values.personal.studentFirstName,
                    parentOrientationDate: semesterDates.parentOrientation,
                    secondaryEmail: values.personal.secondaryEmail,
                  }),
                }).then(async (res) => {
                  if (!res.ok) {
                    const { message } = await res.json()
                  }
                  const applicationData =
                    applicationDoc.data() as Data.Registration
                  clearInterval(saveInterval)
                  saveInterval = undefined
                  values = cloneDeep(applicationData)
                  dbValues = cloneDeep(applicationData)
                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                  })
                  alert.trigger(
                    'success',
                    'Your student account has been created!',
                  )
                })
              },
            )
          })
          .catch((err) => {
            disabled = false
            alert.trigger('error', err.code, true)
          })
      } else {
        showValidation = true
        alert.trigger('error', e.detail.error)
      }
    }
  }
  function handleUnload(e: BeforeUnloadEvent) {
    if (!isEqual(dbValues, values)) {
      e.preventDefault()
      e.returnValue = 'Save changes before leaving?'
      return 'Save changes before leaving?'
    }
  }
</script>

<svelte:window on:beforeunload={handleUnload} />
<Form
  class={clsx('max-w-2xl', showValidation && 'show-validation')}
  on:submit={handleSubmit}
>
  {#if new Date() >= new Date(semesterDates.registrationsDue)}
    <Card class="mb-6 bg-red-50 border-red-200">
      <div class="flex items-start gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-6 w-6 text-red-600 shrink-0 mt-0.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <div>
          <h3 class="font-semibold text-red-800">Registration Deadline Passed</h3>
          <p class="text-red-700 text-sm mt-1">
            The student registration deadline has passed. Registrations were due <span class="font-semibold">
              {new Date(semesterDates.registrationsDue).toDateString()}
            </span> at 11:59 PM ET. Unfortunately, you cannot register students for this semester.
          </p>
        </div>
      </div>
    </Card>
  {/if}
{#if values.meta.submitted}
<div
  class="rounded-md bg-green-100 px-4 py-2 text-green-900 shadow-sm w-full"
>
  An account has been created for {values.personal.studentFirstName}{' '}! You will be able to enroll this child in classes once enrollment opens. Please make sure that you have successfully created an account for each child you wish to enroll this semester. 
  <br/> <br/> Parent orientation will be on {new Date(semesterDates.parentOrientation).toDateString()}, so keep an eye out for an email with details!
  <br/> <br/> If you have any questions, or want to update something about a student account, reach out to contact@gbstem.org!
</div>
{:else}
  <fieldset class="space-y-14" {disabled}>
    {#if values.personal.studentFirstName !== ''}
      <div
        class="rounded-md bg-red-100 px-4 py-2 text-center text-green-900 shadow-sm w-full"
      >
        You have a student account creation in progress for {values.personal.studentFirstName}. Remember to complete this form and submit it by the deadline of {new Date(semesterDates.registrationsDue).toDateString()}! If you have any questions or problems with the form, please reach out to us at contact@gbstem.org!
      </div>
    {/if}
    <div class="grid gap-1">
      <span class="mt-3 font-bold">Student Account Creation Form</span>
      <p class="mb-2">
        Please fill out this form with some basic information to create a student account for the semester. 
        Once you have created an account for a student, you can sign that student up for classes when enrollment opens in a few weeks.
        Please ensure to create a different account for each student you intend to sign up.        
        You will receive an email notification when class enrollment opens. 
        Slots are on a first-come, first-served basis.
      </p>
      <span class="font-bold">Personal</span>
      <Card class="my-2 grid gap-3">
        <div class="rounded-md bg-gray-100 px-3 py-2 shadow-sm">
          {`Parent Name: ${values.personal.parentFirstName} ${values.personal.parentLastName}`}
        </div>
        <div class="rounded-md bg-gray-100 px-3 py-2 shadow-sm">
          {`Email: ${values.personal.email}`}
        </div>
        <div class="text-sm">
          Wrong name or email? Go to your <a class="link" href="/profile"
            >profile</a
          > to update your information.
        </div>
      </Card>

      <Input
        type="text"
        bind:value={values.personal.studentFirstName}
        label="Student first name"
        floating
        required
      />

      <Input
        type="text"
        bind:value={values.personal.studentLastName}
        label="Student last name"
        floating
        required
      />

      <Input
        type="email"
        bind:value={values.personal.secondaryEmail}
        label="Secondary email"
        floating
      />
      <Input
        type="tel"
        bind:value={values.personal.phoneNumber}
        label="Phone number"
        floating
        required
      />
      <Input
        type="date"
        bind:value={values.personal.dateOfBirth}
        label="Student Date of birth"
        floating
        required
      />
      <Select
        bind:value={values.personal.gender}
        label="Student gender"
        options={gendersJson}
        floating
        required
      />
      <div class="grid gap-1">
        <span>Race / ethnicity (check all that apply)</span>
        <div class="grid grid-cols-2">
          {#each raceJson as race}
            <Input
              type="checkbox"
              bind:value={values.personal.race}
              label={race.name}
            />
          {/each}
        </div>
      </div>

      <Select
        bind:value={values.personal.frlp}
        label="Eligible for federal free or reduced lunch program?"
        options={frlpJson}
        floating
        required
      />
      <Select
        bind:value={values.personal.parentEducation}
        label="Parent's highest level of education"
        options={parentEducationJson}
        floating
        required
      />
    </div>
    <div class="grid gap-1">
      <span class="font-bold">Academic</span>
      <div class="grid gap-1 sm:grid-cols-3 sm:gap-3">
        <div class="sm:col-span-2">
          <Input
            type="text"
            bind:value={values.academic.school}
            label="Student's current school"
            floating
            required
          />
        </div>
        <Select
          bind:value={values.academic.grade}
          label="Student Grade"
          options={gradesJson}
          floating
          required
        />
      </div>
    </div>
    <div class="grid gap-1">
      <span class="font-bold">Course Interest (max 2 courses)</span>
      <span
        >Note that selecting your courses below is NOT formally enrolling in the
        course. Your response here will help us estimate the number of sections
        for each course. Course enrollment will be on a first-come, first-served
        basis, and you will be notified via email when enrollment opens.
      </span>
      <span
        >Go to <Link href="https://gbstem.org/#/cs" class="link" target="_blank"
          >https://gbstem.org/#/cs
        </Link> for more information</span
      >
      <div class="mb-2">
        <Select
          bind:value={values.program.csCourse}
          label="Computer Science course"
          options={csCoursesJson}
          floating
          required
        />
      </div>
      <span
        >Go to <Link
          href="https://gbstem.org/#/math"
          class="link"
          target="_blank"
          >https://gbstem.org/#/math
        </Link> for more information.
      </span>
      <span class="text-sm"
        >gbSTEM math classes have a separate fall and spring curriculum for each
        level. For example, we offer Math 1a in the Fall and Math 1b in the
        Spring.

        <p class="font-bold">Students whose last gbSTEM math class was in the fall:</p>
        <p>
          If you took an "a" math class in the fall semester, it's advisable to
          opt for the "b" version of the course in the spring. For example, if you completed
          Math 2a in the fall, you should proceed to Math 2b.
        </p>

        <p class="font-bold">Students whose last gbSTEM math class was in the spring:</p>

        <p>
          If your most recent math class was in the spring semester (and
          you did not take any math class in the fall semester), we recommend waiting until
          next fall to enroll in a math course. This is because if you completed Math 3b in the spring, you
          should proceed to Math 4a, but unfortunately, we don't offer the "a"
          section of math courses in the spring, so we recommend waiting until the fall.
        </p>
      </span>
      <div class="mb-2">
        <Select
          bind:value={values.program.mathCourse}
          label="Math course"
          options={mathCoursesJson}
          floating
          required
        />
      </div>
      <span
        >Go to <Link
          href="https://gbstem/#/engineering"
          class="link"
          target="_blank"
          >https://gbstem.org/#/engineering
        </Link> for more information</span
      >
      <div class="mb-2">
        <Select
          bind:value={values.program.engineeringCourse}
          label="Engineering course"
          options={engineeringCoursesJson}
          floating
          required
        />
      </div>
      <span
        >Go to <Link
          href="https://gbstem.org/#/science"
          class="link"
          target="_blank"
          >https://gbstem.org/#/science
        </Link> for more information</span
      >
      <div class="mt-2">
        <Select
          bind:value={values.program.scienceCourse}
          label="Science course"
          options={scienceCoursesJson}
          floating
          required
        />
      </div>
      <span
      >Go to <Link
        href="https://gbstem.org/#/robotics"
        class="link mt-2"
        target="_blank"
        >https://gbstem.org/#/robotics
      </Link> for more information</span
      >
      <Input
        type="checkbox"
        bind:value={values.program.inPerson}
        label="For our in-person offering in the spring, gbSTEM is holding a new Lego Robotics competition program for students grade 5 and up. The program will meet weekly in-person at the Cambridge Public Library on Saturdays 1:00-3:00pm; parents are encouraged to help coach the robotics team. There are 20 slots available this year and will be more in the future. You may apply for this program on top of two courses, but if you are selected you will only be able to enroll in one additional course. Would you like to apply for the robotics program?"
      />
      <span class="font-bold mt-8">Additional Information</span>
      <div class="mt-2">
        <Select
          bind:value={values.program.reason}
          label="How did you learn about gbSTEM?"
          options={reasonsJson}
          floating
          required
        />
      </div>
      {#if values.program.inPerson}
        <Input
        type="text"
        bind:value={values.inPerson.allergies}
        label="Please list any allergies the student has."
        />
        <Input
        type="text"
        bind:value={values.inPerson.parentPickup}
        label="Please list the names, emails, and phone numbers of the people who are authorized to pick up the student from in-person classes."
        required
      />
      {/if}
    </div>
    <div class="grid gap-1">
      <span class="font-bold">Agreements</span>
      <div class="grid">
        {#if values.program.inPerson}
          <Input
          type="checkbox"
          bind:value={values.agreements.mediaRelease}
          label="Do you give consent to your child's picture being used in gbSTEM publications, including website, newsletter, and social media posts? Names and personal information will not be shared."
          required
        />
        {/if}
        <Input
          type="checkbox"
          bind:value={values.agreements.entireProgram}
          label={`gbSTEM will run from ${new Date(semesterDates.classesStart).toDateString()} to ${new Date(semesterDates.classesEnd).toDateString()}. Will the student be able to participate throughout the entirety of the program?`}
          required
        />
        <Input
          type="checkbox"
          bind:value={values.agreements.timeCommitment}
          label="Do you hereby confirm that the student can meet the gbSTEM weekly time commitment? Please understand that an unused spot for your child prevents others from joining or getting their preferred time slots. The time commitment for EACH course selected is at minimum 2 hours per week.  This means that if your student takes an engineering and math course the time commitment will be 4 hours a week. Students are not allowed to miss classes unless for medical reasons or family emergencies."
          required
        />
        <Input
          type="checkbox"
          bind:value={values.agreements.submitting}
          label="I understand submitting means I can no longer make changes to my registration. Don't check this box until you are sure that you are ready to submit."
          required
        />
      </div>
      <span class="mt-4"
        >If you have any questions or concerns, please email
        <a href="mailto:contact@gbstem.org" class="link" target="_blank">
          contact@gbstem.org
        </a>.
      </span>
    </div>
    <div class={clsx('grid gap-3', !values.meta.submitted && 'grid-cols-2')}>
      {#if values.meta.submitted}
        <div
          class="rounded-md bg-green-100 px-4 py-2 text-center text-green-900 shadow-sm"
        >
          Registration submitted!
        </div>
      {:else}
        <button
          type="button"
          on:click={() => handleSave(true)}
          class="rounded-md bg-gray-100 px-4 py-2 text-gray-900 shadow-sm transition-colors duration-300 hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-500"
          >Save draft</button
        >
        <button
          type="submit"
          class="rounded-md bg-blue-100 px-4 py-2 text-blue-900 shadow-sm transition-colors duration-300 hover:bg-blue-200 disabled:bg-blue-200 disabled:text-blue-500"
          >Submit</button
        >

        <!-- <Button
          type="button"
          color={'red'}
          on:click={() => {
            handleDelete()
          }}>Delete draft</Button
        > -->
      {/if}
    </div>
  </fieldset>
{/if}
</Form>
