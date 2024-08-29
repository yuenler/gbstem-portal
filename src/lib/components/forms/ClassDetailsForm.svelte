<script lang="ts">
  import { db, user } from '$lib/client/firebase'
  import { alert } from '$lib/stores'
  import Form from '$lib/components/Form.svelte'
  import Button from '../Button.svelte'
  import Select from '$lib/components/Select.svelte'
  import Input from '$lib/components/Input.svelte'
  import { cn, formatDate, timestampToDate } from '$lib/utils'
  import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
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

  
  onMount(() => {    
    return user.subscribe((user) => {
      if (user) {
        getDoc(doc(db, classesCollection, user.object.uid)).then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data()
            values = data as Data.Class
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
    const time1 = new Date(values.meetingTimes[0]).getHours()
    const time2 = new Date(values.meetingTimes[1]).getHours()
    let url: string = ''

    const earliestClassPossible = new Date(semesterDates.classesStart)
    const earliestClassLatestPossibleEndTime = new Date(semesterDates.classesStart)
    earliestClassPossible.setHours(Math.min(time1, time2))
    earliestClassLatestPossibleEndTime.setHours(Math.max(time1, time2) + 2)

    const event = {
      subject: `${values.course} Class Meeting`,
      body: {
        contentType: 'HTML',
        content: `${values.course} Class Meeting`
      },
      start: {
          dateTime: earliestClassPossible,
          timeZone: 'UTC'
      },
      end: {
          dateTime: earliestClassLatestPossibleEndTime,
          timeZone: 'UTC'
      },
      recurrence: {
        pattern: {
          type: 'weekly',
          interval: 1,
          daysOfWeek: [values.classDay1, values.classDay2],
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
    await fetch ('https://login.microsoftonline.com/c9f983d8-6c86-4534-8471-99c48eaab882/oauth2/v2.0/authorize', {
      method: 'GET',
      headers: {
        'Host': 'login.microsoftonline.com',
        'Mode': 'no-cors',
      },
      body: JSON.stringify({
        client_id: '504d54dc-0e38-417f-b167-fe6f77a56cbd',
        scope: 'User.Write',
        response_mode: 'query',
        response_type: 'code',
      })
    }).then((response) => response.json()).then((res) => {
      console.log(res)
    }).catch((err) => {
      console.log(err)
    })

    await fetch('https://graph.microsoft.com/v1.0/users/kendree@gbstem.onmicrosoft.com/calendar/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IktRMnRBY3JFN2xCYVZWR0JtYzVGb2JnZEpvNCIsImtpZCI6IktRMnRBY3JFN2xCYVZWR0JtYzVGb2JnZEpvNCJ9.eyJhdWQiOiJhcGk6Ly81MDRkNTRkYy0wZTM4LTQxN2YtYjE2Ny1mZTZmNzdhNTZjYmQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jOWY5ODNkOC02Yzg2LTQ1MzQtODQ3MS05OWM0OGVhYWI4ODIvIiwiaWF0IjoxNzI0OTE1OTczLCJuYmYiOjE3MjQ5MTU5NzMsImV4cCI6MTcyNDkxOTg3MywiYWlvIjoiRTJkZ1lPaXUyc1JVOXNTYzQrR0ppNzBUdUs5K0F3QT0iLCJhcHBpZCI6IjUwNGQ1NGRjLTBlMzgtNDE3Zi1iMTY3LWZlNmY3N2E1NmNiZCIsImFwcGlkYWNyIjoiMSIsImlkcCI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0L2M5Zjk4M2Q4LTZjODYtNDUzNC04NDcxLTk5YzQ4ZWFhYjg4Mi8iLCJvaWQiOiIzZDAyODM2Yy1hYzc3LTRlYTktODVkYy1jNGY1N2M3MDAyNTMiLCJyaCI6IjAuQWJjQTJJUDV5WVpzTkVXRWNabkVqcXE0Z3R4VVRWQTREbjlCc1dmLWIzZWxiTDM4QUFBLiIsInJvbGVzIjpbIlRhc2suQWRtaW4iXSwic3ViIjoiM2QwMjgzNmMtYWM3Ny00ZWE5LTg1ZGMtYzRmNTdjNzAwMjUzIiwidGlkIjoiYzlmOTgzZDgtNmM4Ni00NTM0LTg0NzEtOTljNDhlYWFiODgyIiwidXRpIjoiQVBISUdnVFZBME9jYWZ6bDM5VUhBQSIsInZlciI6IjEuMCJ9.WpJpPCfVQ-hN98LOw_A6sVrm1nK_6ryIS4bkakmPgdKRzs7xCBR-b5j8juqfHtTaNPcFOv8B1F87LVuD9hff3jryW2A6tZSBq5JUMdTJXRAGkIJ6tFybSs3jlBZ-31bUnbld7hcAFkrYjmwWSrKAD70_0nlE70T29RmSyLKMYSvjWZ7UZ7Ckic9Uylb8ENCWFBu081xQ_EN75tJcIpdG49Qn5OkdpHOO2wGOiydxx2fwsPuqjFBVoEkWQ4iOwXyVQvTb2WBxuhWXrnBe3Ujt2EFalQzzR0zFnh1XdwwsTK8Wa60I12TCQvs3NbvtE2H0K_ZthpJUZPa4X6CQOSxolA'}`,
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
        setDoc(doc(db, classesCollection, frozenUser.object.uid), values)
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
    <h2 class="text-xl font-bold">Your class details</h2>

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
        >Online classes meet twice weekly at consistent days and times
        throughout the semester and run for 45-60 minutes each. In-person
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

      {#if values.online}
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
{:else if values.course === '' ||  submitted === false} 
<Card>
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
    <h2 class="text-xl font-bold">Your class details</h2>

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
        >Online classes meet twice weekly at consistent days and times
        throughout the semester and run for 45-60 minutes each. In-person
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

      {#if values.online}
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
      <Button color="blue" on:click={createLink}>Create meeting link</Button>
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
</Card>
{:else}
<div></div>
{/if}