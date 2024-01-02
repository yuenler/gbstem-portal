<script lang="ts">
  import {
    collection,
    query,
    getDocs,
    updateDoc,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    Timestamp,
  } from 'firebase/firestore'
  import { onMount } from 'svelte'
  import { db, user } from '$lib/client/firebase'
  import Input from '$lib/components/Input.svelte'
  import Form from '$lib/components/Form.svelte'
  import clsx from 'clsx'
  import { alert } from '$lib/stores'
  import { cloneDeep } from 'lodash-es'
  import Card from '../Card.svelte'

  let showValidation = false
  let valuesJson: Data.Interview[] = []

  let scheduledInterview: Data.Interview = {
    date: '',
    id: '',
    interviewerFirstName: '',
    interviewerLastName: '',
    interviewerEmail: '',
    intervieweeFirstName: '',
    intervieweeLastName: '',
    intervieweeId: '',
    intervieweeEmail: '',
    interviewLink: '',
    interviewSlotStatus: 'available',
  }

  let scheduled = false

  let interviewee = {
    email: '',
    firstName: '',
    lastName: '',
    id: '',
  }

  function handleSubmit() {
    console.log(scheduledInterview)
    scheduledInterview.interviewSlotStatus = 'pending'
    scheduled = true
    scheduledInterview.intervieweeFirstName = interviewee.firstName
    scheduledInterview.intervieweeLastName = interviewee.lastName
    updateDoc(doc(db, 'instructorInterviewTimes', scheduledInterview.id), {
      interviewSlotStatus: scheduledInterview.interviewSlotStatus,
      intervieweeFirstName: interviewee.firstName,
      intervieweeLastName: interviewee.lastName,
      intervieweeId: interviewee.id,
    })
    fetch('/api/interview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: scheduledInterview.interviewerEmail,
        date: new Date(scheduledInterview.date).toUTCString() + ', or ' + new Date(scheduledInterview.date).toLocaleTimeString() + ' local time',
        link: scheduledInterview.interviewLink,
        interviewer: scheduledInterview.interviewerFirstName,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const { message } = await res.json()
        console.log(message)
      }
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    })
    alert.trigger(
      'success',
      'Thank you for signing up for an interview! You will receive an email with the details shortly.',
    )
  }

  async function getData() {
    user.subscribe((user) => {
      if (user) {
        getDoc(doc(db, 'applicationsSpring24', user.object.uid)).then(
          (applicationDoc) => {
            const applicationExists = applicationDoc.exists()
            if (applicationExists) {
              const applicationData = applicationDoc.data() as Data.Application
              interviewee['email'] = applicationData.personal['email']
              interviewee.firstName = applicationData.personal.firstName
              interviewee.lastName = applicationData.personal.lastName
              interviewee.id = applicationData.meta.id
            }
          },
        )
      }
    })
    const q = query(collection(db, 'instructorInterviewTimes'))
    const querySnapshot = await getDocs(q)
    querySnapshot.forEach((doc) => {
      const json = doc.data()
      if (json['intervieweeId'] === interviewee.id) {
        scheduledInterview = json as Data.Interview
      } else {
        if (json['interviewSlotStatus'] === 'available') {
          valuesJson.push({
            date: new Date(json['date']).toLocaleString(),
            id: doc.id,
            interviewerFirstName: json['interviewerFirstName'],
            interviewerLastName: json['interviewerLastName'],
            interviewerEmail: json['interviewerEmail'],
            interviewLink: json['interviewLink'],
            interviewSlotStatus: json['interviewSlotStatus'],
            intervieweeFirstName: ' ',
            intervieweeLastName: ' ',
            intervieweeId: ' ',
            intervieweeEmail: ' ',
          })
        }
      }
    })
    return valuesJson
  }

  let data = getData()
</script>

{#await data then value}
  <Card class="my-2 grid gap-3">
    {#if scheduledInterview.interviewSlotStatus === 'available'}
      <h2 class="font-bold">Available Interview Slots</h2>
      <div>
        Please sign up for one. If there are no slots available for you, please
        email contact@gbstem.org and we will try to find a time that works for
        you.
      </div>
      <Form
        class={clsx('max-w-2xl', showValidation && 'show-validation')}
        on:submit={handleSubmit}
      >
        <div class="mb-4">
          <div class="grid grid-cols-2 gap-2">
            {#each value as val}
              <label>
                <input
                  type="radio"
                  bind:group={scheduledInterview}
                  value={val}
                />
                {val.date}
              </label>

              <!-- <label>
              <input type="radio" bind:group={} value={2} />
              Two scoops
            </label>
            
            <label>
              <input type="radio" bind:group={} value={3} />
              Three scoops
            </label> -->
              <!-- <Input
                type="checkbox"
                bind:value={selectedId}
                label={new Date(
                  Number(val.date['seconds'] * 1000),
                ).toUTCString()}
                name={val.id}
                floating
                required
              /> -->
            {/each}
          </div>
        </div>
        <button
          type="submit"
          class="rounded-md bg-blue-100 px-4 py-2 text-blue-900 shadow-sm transition-colors duration-300 hover:bg-blue-200 disabled:bg-blue-200 disabled:text-blue-500"
          >Submit</button
        >
      </Form>
    {:else if scheduledInterview.interviewSlotStatus === 'pending'}
      <div
        class="rounded-md bg-green-100 px-4 py-2 text-center text-green-900 shadow-sm"
      >
        Your interview will be on {new Date(scheduledInterview.date).toUTCString()}, or {new Date(scheduledInterview.date).toLocaleTimeString()} local time.
      </div>
    {:else}
      <div
        class="rounded-md bg-green-100 px-4 py-2 text-center text-green-900 shadow-sm"
      >
        Your interview was on {new Date(scheduledInterview.date).toUTCString()}, or {new Date(scheduledInterview.date).toLocaleTimeString()} local time.. Thank you for applying to gbSTEM!
      </div>
    {/if}
  </Card>
{/await}
