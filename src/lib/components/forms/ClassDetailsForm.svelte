<script lang="ts">
  import { db, user } from '$lib/client/firebase'
  import { alert } from '$lib/stores'
  import Form from '$lib/components/Form.svelte'
  import Button from '../Button.svelte'
  import Select from '$lib/components/Select.svelte'
  import Input from '$lib/components/Input.svelte'
  import { cn } from '$lib/utils'
  import { doc, setDoc, getDocs, collection } from 'firebase/firestore'
  import { onMount } from 'svelte'
  import { coursesJson, daysOfWeekJson } from '$lib/data'
  import { classesCollection } from '$lib/data/constants'
  import { ClassStatus } from '../helpers/ClassStatus'

  export let semesterDates: Data.SemesterDates

  import Dialog from '../Dialog.svelte'
  import Card from '../Card.svelte'

 export let classDetailsDialogEl: Dialog | undefined
 export let dialog = false

  let disabled = false
  let showValidation = false
  let submitted = false
  let meetingLink
  let isCreatingNewClass = false

  let values: Data.Class = {
    classDay1: '',
    classTime1: '',
    classDay2: '',
    classTime2: '',
    meetingLink: '',
    gradeRecommendation: '',
    course: '',
    submitting: false,
    meetingTimes: [],
    completedClassDates: [],
    feedbackCompleted: [],
    classStatuses: [],
    instructorFirstName: '',
    instructorLastName: '',
    instructorEmail: '',
    otherInstructorEmails: '',
    classCap: 7,
    online: true,
    students: [],
  }

  let createClassSchedule = true

  function selectClass(classKey: string) {
    selectedClassKey = classKey
    values = instructorClasses[classKey]
    if(values.course !== '') {
      submitted = true
    }
    disabled = true
    createClassSchedule = false
    isCreatingNewClass = false
  }

  function createNewClass() {
    selectedClassKey = ''
    values = {
      classDay1: '',
      classTime1: '',
      classDay2: '',
      classTime2: '',
      meetingLink: '',
      gradeRecommendation: '',
      course: '',
      submitting: false,
      meetingTimes: [],
      completedClassDates: [],
      feedbackCompleted: [],
      classStatuses: [],
      instructorFirstName: '',
      instructorLastName: '',
      instructorEmail: '',
      otherInstructorEmails: '',
      classCap: 7,
      online: true,
      students: [],
    }
    submitted = false
    disabled = false
    createClassSchedule = true
    isCreatingNewClass = true
  }

  function getMeetingDates(
    classDay1: string,
    classDay2: string,
    classTime1: string,
    classTime2: string,
    startDate: Date,
    endDate: Date,
  ): Date[] {
    const meetingDates = []
    const dayMap: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    }

    let currentDate = new Date(startDate.getTime())
    while (currentDate <= endDate) {
      if (currentDate.getDay() === dayMap[classDay1]) {
        let meetingTime = parseTime(classTime1, currentDate)
        meetingDates.push(new Date(meetingTime))
      }
      if (currentDate.getDay() === dayMap[classDay2]) {
        let meetingTime = parseTime(classTime2, currentDate)
        meetingDates.push(new Date(meetingTime))
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return meetingDates
  }

  
  let instructorClasses: {[key: string]: Data.Class} = {}
  let selectedClassKey = ''
  let availableClassKeys: string[] = []

  onMount(() => {   
    return user.subscribe((user) => {
      if (user) {
        // Get all classes for this instructor
        getDocs(collection(db, classesCollection)).then((querySnapshot) => {
          const userClasses: {[key: string]: Data.Class} = {}
          
          querySnapshot.forEach((doc) => {
            if (doc.id.startsWith(user.object.uid + '-')) {
              const classNumber = doc.id.split('-')[1]
              userClasses[classNumber] = doc.data() as Data.Class
            }
          })
          
          instructorClasses = userClasses
          availableClassKeys = Object.keys(instructorClasses)
          
          // If instructor has classes, select the first one
          if (availableClassKeys.length > 0) {
            selectedClassKey = availableClassKeys[0]
            values = instructorClasses[selectedClassKey]
            if(values.course !== '') {
              submitted = true
            }
            disabled = true
            createClassSchedule = false
          }
        })
      }
    })
  })

  function parseTime(time: string, date: Date): Date {
    const [hours, minutes] = time.split(':').map((str) => parseInt(str, 10))
    date.setHours(hours, minutes, 0, 0)
    return date
  }

  function formatIntlDate(date: Date) {
        var month = '' + (date.getMonth() + 1)
        var day = '' + date.getDate()
        var year = date.getFullYear()

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

 async function createLink(): Promise<string> { 
    if (values.classDay1 === '') {
      alert.trigger('error', 'Please select at least one class day before creating a meeting link.')
      return ''
    }

  const time1 = values.meetingTimes?.[0] ? new Date(values.meetingTimes[0]).getHours() : 9
  const time2 = values.meetingTimes?.[1] ? new Date(values.meetingTimes[1]).getHours() : 9

  let url: string = ''

  const earliestClassPossible = new Date()
  earliestClassPossible.setHours(9)
  const earliestClassLatestPossibleEndTime = new Date()
  earliestClassLatestPossibleEndTime.setHours(23)

  const daysOfWeek = [values.classDay1]
  if (values.classDay2) {
    daysOfWeek.push(values.classDay2)
  }

    const event = {
      subject: `${values.course} Class Meeting`,
      body: {
        contentType: 'HTML',
        content: `${values.course} Class Meeting`
      },
      start: {
          dateTime: earliestClassPossible.toISOString(),
          timeZone: 'UTC'
      },
      end: {
          dateTime: earliestClassLatestPossibleEndTime.toISOString(),
          timeZone: 'UTC'
      },
      recurrence: {
        pattern: {
          type: 'weekly',
          interval: 1,
          daysOfWeek: daysOfWeek,
        },
        range: {
          type: 'numbered',
          startDate: formatIntlDate(new Date(semesterDates.classesStart)),
          numberOfOccurrences: 100,
        },
      },
      location: {
          displayName: 'Online'
      },
      attendees: [],
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness'
    };

    const token = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
      }).then((response) => response.json()).then((res) => {
        console.log(res)
        return res.access_token
      }).catch((err) => {
        console.log(err)
      })

    await fetch('https://graph.microsoft.com/v1.0/users/kendree@gbstem.onmicrosoft.com/calendar/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }, 
      body: JSON.stringify(event)
    }).then((response) => response.json()).then((res) => {
      console.log(res)
      url = res.onlineMeeting.joinUrl
      return res.onlineMeeting.joinUrl
    }).catch((err) => {
      console.log(err)
    })
    alert.trigger('success', 'Meeting link created!')
    return url
  }

  async function handleSubmit(e: CustomEvent<SubmitData>) {
    if (e.detail.error === null) {
      showValidation = false
      disabled = true
      if ($user) {
        const frozenUser = $user
        if (createClassSchedule) {
          const meetingTimes = getMeetingDates(
            values.classDay1,
            values.classDay2,
            values.classTime1,
            values.classTime2,
            new Date(semesterDates.classesStart),
            new Date(semesterDates.classesEnd),
          )
          values.meetingTimes = meetingTimes
          values.feedbackCompleted = new Array(meetingTimes.length).fill(false)
          values.classStatuses = new Array(meetingTimes.length).fill(ClassStatus.ClassInFuture)
        }
        values.instructorFirstName = frozenUser.profile.firstName
        values.instructorLastName = frozenUser.profile.lastName
        values.instructorEmail = frozenUser.object.email as string
        if(values.meetingLink === '') {
          values.meetingLink = await createLink()
        }
        
        // Determine class number for new classes
        let classNumber = selectedClassKey
        if (!classNumber) {
          // For new classes, find the next available number
          const existingNumbers = availableClassKeys.map(key => parseInt(key)).filter(n => !isNaN(n))
          classNumber = existingNumbers.length > 0 ? (Math.max(...existingNumbers) + 1).toString() : '1'
        }
        
        const classId = `${frozenUser.object.uid}-${classNumber}`
        setDoc(doc(db, classesCollection, classId), values)
          .then(() => {
            disabled = true
            submitted = true
             alert.trigger('success', `Class details saved! You can join class by clicking the Join Class button above!`);
             setTimeout(() => location.reload(), 2000)
          })
          .catch((err) => {
            disabled = false
            alert.trigger('error', err.code, true)
          })
      }
    } else {
      showValidation = true
      alert.trigger('error', e.detail.error)
    }
  }
</script>
{#if dialog === true}
<Dialog bind:this={classDetailsDialogEl} size="full" alert>
  <svelte:fragment slot="title"><div class = "flex justify-between items-center">Your class details <Button color = 'red' class="font-light" on:click={classDetailsDialogEl.cancel}>Close</Button></div> </svelte:fragment>
  <div slot="description">
    <Card class="sticky top-2 z-50 flex justify-between gap-3 p-3 md:p-3">
<Form class={cn(showValidation && 'show-validation')} on:submit={handleSubmit}>
  {#if disabled}
    <Button color="blue" class="mb-5" on:click={() => (disabled = false)}
      >Edit class details</Button
    >
    <p>Note that editing your class details will reset your class schedule.</p>
  {/if}

  <fieldset class="mt-4 space-y-4" {disabled}>
    <p>
      Please do not fill this form out until you have been told by gbSTEM
      leadership what class you will be teaching. Submitting this form will generate a meeting link for your class; you can join using the 'Join Class' button in the portal.
    </p>
    
    <!-- Class Management Section -->
    <div class="bg-gray-50 p-4 rounded-lg">
      <h3 class="text-lg font-semibold mb-3">Manage Your Classes</h3>
      
      <div class="flex flex-wrap gap-2 mb-3">
        {#each availableClassKeys as classKey}
          <Button 
            color={selectedClassKey === classKey ? "blue" : "gray"}
            on:click={() => selectClass(classKey)}
          >
            Class {classKey}
            {#if instructorClasses[classKey]?.course}
              - {instructorClasses[classKey].course}
            {/if}
          </Button>
        {/each}
        
        <Button color="green" on:click={createNewClass}>
          + Create New Class
        </Button>
      </div>
      
      {#if isCreatingNewClass}
        <p class="text-sm text-blue-600">Creating new class...</p>
      {:else if selectedClassKey}
        <p class="text-sm text-gray-600">Editing Class {selectedClassKey}</p>
      {:else if availableClassKeys.length === 0}
        <p class="text-sm text-gray-600">No classes created yet. Click "Create New Class" to start.</p>
      {/if}
    </div>

    <h2 class="text-xl font-bold">
      {isCreatingNewClass ? 'New Class Details' : selectedClassKey ? `Class ${selectedClassKey} Details` : 'Class Details'}
    </h2>

    <Select
      bind:value={values.course}
      label="Course"
      options={coursesJson}
      floating
      required
    />

    <Input
      type="text"
      bind:value={values.gradeRecommendation}
      label="Grade recommendation. For example, 3-5 or 6-8."
    />

    <div class="grid gap-1">
      <span class="font-bold"
        >Online classes meet once weekly at consistent days and times
        throughout the semester and run for 60 minutes each; with the exception of math, which meets twice weekly for 60 minutes each. In-person
        classes meet once a week on a weekend afternoon at the Cambridge Public
        Library.
      </span>

      <div class="grid gap-1 sm:grid-cols-3 sm:gap-3">
        <div class="sm:col-span-2">
          <Select
            bind:value={values.classDay1}
            label="Meeting day 1"
            options={daysOfWeekJson}
            floating
            required
          />
        </div>
        <Input
          type="time"
          bind:value={values.classTime1}
          label="Meeting time 1"
          floating
          required
        />
      </div>

      {#if values.course && values.course.toLowerCase().includes('math') && values.online}
        <div class="grid gap-1 sm:grid-cols-3 sm:gap-3">
          <div class="sm:col-span-2">
            <Select
              bind:value={values.classDay2}
              label="Meeting day 2"
              options={daysOfWeekJson}
              floating
              required
            />
          </div>
          <Input
            type="time"
            bind:value={values.classTime2}
            label="Meeting time 2"
            floating
          />
        </div>
      {/if}
    </div>
    <Input
      type="number"
      bind:value={values.classCap}
      label="Class capacity"
      floating
      required
    />

    <Input
      type="text"
      bind:value={values.otherInstructorEmails}
      label="Enter the emails of any co-instructors here, comma separated. Keep in mind that only one instructor per class should fill out this form."
    />

    {#if values.online}
      <Input
        type="text"
        bind:value={values.meetingLink}
        label="Your meeting link. If you have Zoom Pro/Google Meet Pro and prefer to use it, you may enter the link here. Otherwise, you should use the Teams link."
        />
    {/if}

    <Input
      type="checkbox"
      bind:value={values.online}
      label="Class taught online?"
    />

    <Input
      type="checkbox"
      bind:value={values.submitting}
      label="I understand submitting will make my class available for registration, so I should not submit until I am sure the class and class times work for me."
      required
    />

    <Input
      type="checkbox"
      bind:value={createClassSchedule}
      label="Would you like a class schedule to be automatically created for you? Typically, you want to check this box the first time you submit your class details, but you should avoid checking this box when submitting the form again to edit your class details because it will overwrite changes you have made to your existing class schedule."
    />

    <div class="flex justify-end">
      <Button color="blue" type="submit">Submit</Button>
    </div>
  </fieldset>
</Form>
</Card>
</div>
</Dialog>
{:else}
<Form class={cn(showValidation && 'show-validation')} on:submit={handleSubmit}>
  {#if disabled}
    <Button color="blue" class="mb-5" on:click={() => (disabled = false)}
      >Edit class details</Button
    >
    <p>Note that editing your class details will reset your class schedule.</p>
  {/if}

  <fieldset class="mt-4 space-y-4" {disabled}>
    <p>
      Please do not fill this form out until you have been told by gbSTEM
      leadership what class you will be teaching.
    </p>
    
    <!-- Class Management Section -->
    <div class="bg-gray-50 p-4 rounded-lg">
      <h3 class="text-lg font-semibold mb-3">Manage Your Classes</h3>
      
      <div class="flex flex-wrap gap-2 mb-3">
        {#each availableClassKeys as classKey}
          <Button 
            color={selectedClassKey === classKey ? "blue" : "gray"}
            on:click={() => selectClass(classKey)}
          >
            Class {classKey}
            {#if instructorClasses[classKey]?.course}
              - {instructorClasses[classKey].course}
            {/if}
          </Button>
        {/each}
        
        <Button color="green" on:click={createNewClass}>
          + Create New Class
        </Button>
      </div>
      
      {#if isCreatingNewClass}
        <p class="text-sm text-blue-600">Creating new class...</p>
      {:else if selectedClassKey}
        <p class="text-sm text-gray-600">Editing Class {selectedClassKey}</p>
      {:else if availableClassKeys.length === 0}
        <p class="text-sm text-gray-600">No classes created yet. Click "Create New Class" to start.</p>
      {/if}
    </div>

    <h2 class="text-xl font-bold">
      {isCreatingNewClass ? 'New Class Details' : selectedClassKey ? `Class ${selectedClassKey} Details` : 'Class Details'}
    </h2>

    <Select
      bind:value={values.course}
      label="Course"
      options={coursesJson}
      floating
      required
    />

    <Input
      type="text"
      bind:value={values.gradeRecommendation}
      label="Grade recommendation. For example, 3-5 or 6-8."
    />

    <div class="grid gap-1">
      <span class="font-bold"
        >Online classes meet once weekly at consistent days and times
        throughout the semester and run for 60 minutes each; with the exception of math, which meets twice weekly for 60 minutes each. In-person
        classes meet once a week on a weekend afternoon at the Cambridge Public
        Library.
      </span>

      <div class="grid gap-1 sm:grid-cols-3 sm:gap-3">
        <div class="sm:col-span-2">
          <Select
            bind:value={values.classDay1}
            label="Meeting day 1"
            options={daysOfWeekJson}
            floating
            required
          />
        </div>
        <Input
          type="time"
          bind:value={values.classTime1}
          label="Meeting time 1"
          floating
          required
        />
      </div>

      {#if values.course && values.course.toLowerCase().includes('math') && values.online}
        <div class="grid gap-1 sm:grid-cols-3 sm:gap-3">
          <div class="sm:col-span-2">
            <Select
              bind:value={values.classDay2}
              label="Meeting day 2"
              options={daysOfWeekJson}
              floating
              required
            />
          </div>
          <Input
            type="time"
            bind:value={values.classTime2}
            label="Meeting time 2"
            floating
          />
        </div>
      {/if}
    </div>
    <Input
      type="number"
      bind:value={values.classCap}
      label="Class capacity"
      floating
      required
    />

    <Input
      type="text"
      bind:value={values.otherInstructorEmails}
      label="Enter the emails of any co-instructors here, comma separated. Keep in mind that only one instructor per class should fill out this form."
    />
    

    <Input
      type="checkbox"
      bind:value={values.online}
      label="Class taught online?"
    />

    {#if values.meetingLink === '' && values.online}
      <Button color="blue" on:click={async () => values.meetingLink = await createLink()}>Create meeting link</Button>
    {/if}

    {#if values.online}
      <Input
        type="text"
        bind:value={values.meetingLink}
        label="Your meeting link. If you have Zoom Pro/Google Meet Pro and prefer to use it, you may enter the link here. Otherwise, you should use the Teams link."
        />
    {/if}

    <Input
      type="checkbox"
      bind:value={values.submitting}
      label="I understand submitting will make my class available for registration, so I should not submit until I am sure the class and class times work for me."
      required
    />

    <Input
      type="checkbox"
      bind:value={createClassSchedule}
      label="Would you like a class schedule to be automatically created for you? Typically, you want to check this box the first time you submit your class details, but you should avoid checking this box when submitting the form again to edit your class details because it will overwrite changes you have made to your existing class schedule."
    />

    <div class="flex justify-end">
      <Button color="blue" type="submit">Submit</Button>
    </div>
  </fieldset>
</Form>
{/if}
