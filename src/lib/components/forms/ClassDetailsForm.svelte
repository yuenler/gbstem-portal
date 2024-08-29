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
  import { Providers } from '@microsoft/mgt-element'
  import { Msal2Provider } from '@microsoft/mgt-msal2-provider'

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

    Providers.globalProvider = new Msal2Provider({
      clientId: "YOUR_CLIENT_ID",
      scopes: ["User.Read", "Calendars.ReadWrite"]
    });

    await Providers.globalProvider.login();

    const token = await Providers.globalProvider.getAccessToken({
    scopes: ["User.Read"],
    });

    console.log(token);

    await fetch('https://graph.microsoft.com/v1.0/users/kendree@gbstem.onmicrosoft.com/calendar/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${'eyJ0eXAiOiJKV1QiLCJub25jZSI6IkMwQmdwcU82OEdpVTNoeUJQLTBPTmxlOG1YN0Y3TUllRl9VVElXaGVrajQiLCJhbGciOiJSUzI1NiIsIng1dCI6IktRMnRBY3JFN2xCYVZWR0JtYzVGb2JnZEpvNCIsImtpZCI6IktRMnRBY3JFN2xCYVZWR0JtYzVGb2JnZEpvNCJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTAwMDAtYzAwMC0wMDAwMDAwMDAwMDAiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jOWY5ODNkOC02Yzg2LTQ1MzQtODQ3MS05OWM0OGVhYWI4ODIvIiwiaWF0IjoxNzIyNjYwMTAyLCJuYmYiOjE3MjI2NjAxMDIsImV4cCI6MTcyMjc0NjgwMiwiYWNjdCI6MCwiYWNyIjoiMSIsImFpbyI6IkFWUUFxLzhYQUFBQWV4T01xTDc1N2Mza1BNMmlocUZmRVhzeHVoNDlJekl6dERmWHJrUmVLWWFSWWR3ODkzaklUUTNXL045UWRSRU9XWXNHdnBHc0lJd2dFK1UrNWF5VUNTcTNnS1ViTHlXNVdBdW5xYVNHaWUwPSIsImFtciI6WyJwd2QiLCJtZmEiXSwiYXBwX2Rpc3BsYXluYW1lIjoiR3JhcGggRXhwbG9yZXIiLCJhcHBpZCI6ImRlOGJjOGI1LWQ5ZjktNDhiMS1hOGFkLWI3NDhkYTcyNTA2NCIsImFwcGlkYWNyIjoiMCIsImZhbWlseV9uYW1lIjoiQ2hlbiIsImdpdmVuX25hbWUiOiJLZW5kcmVlIiwiaWR0eXAiOiJ1c2VyIiwiaXBhZGRyIjoiOTYuMjM3LjU2LjEzMSIsIm5hbWUiOiJLZW5kcmVlIENoZW4iLCJvaWQiOiI1ZDc0ZmNkMS0xZmZkLTQzNzUtYmY5Ny0yZWIyMDc0NzY3ZmUiLCJwbGF0ZiI6IjMiLCJwdWlkIjoiMTAwMzIwMDNBQjNCRjRGMCIsInJoIjoiMC5BYmNBMklQNXlZWnNORVdFY1puRWpxcTRnZ01BQUFBQUFBQUF3QUFBQUFBQUFBRDhBSm8uIiwic2NwIjoiQ2FsZW5kYXJzLlJlYWRXcml0ZSBvcGVuaWQgcHJvZmlsZSBVc2VyLlJlYWQgZW1haWwiLCJzdWIiOiJMeGFIRkp6aXJtdWlUZHBaX0RoR0k2OEw4cGt6RDZIQ2VOVjVacG5MUFJJIiwidGVuYW50X3JlZ2lvbl9zY29wZSI6Ik5BIiwidGlkIjoiYzlmOTgzZDgtNmM4Ni00NTM0LTg0NzEtOTljNDhlYWFiODgyIiwidW5pcXVlX25hbWUiOiJrZW5kcmVlQGdic3RlbS5vbm1pY3Jvc29mdC5jb20iLCJ1cG4iOiJrZW5kcmVlQGdic3RlbS5vbm1pY3Jvc29mdC5jb20iLCJ1dGkiOiItMTBha3FIcWNFV0NUanQ4TXpVSUFBIiwidmVyIjoiMS4wIiwid2lkcyI6WyI2MmU5MDM5NC02OWY1LTQyMzctOTE5MC0wMTIxNzcxNDVlMTAiLCJiNzlmYmY0ZC0zZWY5LTQ2ODktODE0My03NmIxOTRlODU1MDkiXSwieG1zX2NjIjpbIkNQMSJdLCJ4bXNfaWRyZWwiOiIxIDE2IiwieG1zX3NzbSI6IjEiLCJ4bXNfc3QiOnsic3ViIjoiUThCeElNUkdvWDBCMG1EOTkyWE1kQ2tWbWNOMzNwWngtYlY4UHZPYzhXcyJ9LCJ4bXNfdGNkdCI6MTcyMjAxODY4Nn0.Vu9_SvYpv89EvBJVyUOEGncoJ1UMDrMoOGOva5mobYOBIq5x3LdFgZNtC5UXGCRzg5PXxZPyTzJFb1VSP2K2cH3lx5gW2AmUcBLeTrpeyrpP8SD998JnUgeLfUVQKLuw-QTSyXbkRoQ5Gr4mCdhl-tBMPQsS6OUEEZ8oiAdAJiHZCn_3Xro7Y9i5qzo4ESIe1SkJflC-PylNPJMI5nEC3rkzrHesiuF-OY02T64ThQNgNzPguXMPkErg_W5jFNeICjVT4SM3_xKLHfBL8lNMMHl-2oRtOTJAJH5bsSqUwkvMKaMbb7Hm-J-BAwBNnj13C6Lc-0KQdglDoo0USRvVMg'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    }).then((response) => response.json()).then((res) => {
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