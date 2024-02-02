<script lang="ts">
  import {
    collection,
    query,
    getDocs,
    updateDoc,
    doc,
  } from 'firebase/firestore'
  import { db, user } from '$lib/client/firebase'
  import Form from '$lib/components/Form.svelte'
  import clsx from 'clsx'
  import { alert } from '$lib/stores'
  import Card from '../Card.svelte'
  import Link from '../Link.svelte'
  import { onMount } from 'svelte'
  import Loading from '../Loading.svelte'

  let showValidation = false
  let valuesJson: Data.InterviewSlot[] = []
  let scheduledInterview: Data.InterviewSlot
  let currentUser: Data.User.Store
  let scheduled = false
  let data: Data.InterviewSlot[] = []
  let loading = true

  function handleSubmit() {
    scheduledInterview.interviewSlotStatus = 'pending'
    scheduled = true

    // update application to indicate interview scheduled
    updateDoc(doc(db, 'applicationsSpring24', currentUser.object.uid), {
      'meta.interview': true,
    })

    updateDoc(doc(db, 'instructorInterviewTimes', scheduledInterview.id), {
      interviewSlotStatus: scheduledInterview.interviewSlotStatus,
      intervieweeFirstName: currentUser.profile.firstName,
      intervieweeLastName: currentUser.profile.lastName,
      intervieweeEmail: currentUser.object.email,
      intervieweeId: currentUser.object.uid,
    })
    fetch('/api/interview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: scheduledInterview.interviewerEmail,
        date: scheduledInterview.date + ' Eastern Time',
        link: scheduledInterview.meetingLink,
        interviewer: scheduledInterview.interviewerName,
        firstName: currentUser.profile.firstName,
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

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short', // long, short, narrow
      month: 'short', // numeric, 2-digit, long, short, narrow
      day: 'numeric', // numeric, 2-digit
      hour: 'numeric', // numeric, 2-digit
      minute: 'numeric', // numeric, 2-digit
      hour12: true, // use 12-hour time format with AM/PM
    })
  }

  onMount(() => {
    return user.subscribe(async (user) => {
      if (user) {
        currentUser = user
        data = await getData()
        loading = false
      }
    })
  })

  async function getData() {
    const q = query(collection(db, 'instructorInterviewTimes'))
    const querySnapshot = await getDocs(q)
    querySnapshot.forEach((doc) => {
      const interviewInfo = doc.data()
      if (interviewInfo['intervieweeId'] === currentUser.object.uid) {
        scheduledInterview = {
          ...interviewInfo,
          id: doc.id,
          date: formatDate(new Date(interviewInfo['date'].seconds * 1000)),
          interviewSlotStatus:
            new Date(interviewInfo['date'].seconds * 1000) < new Date()
              ? 'completed'
              : interviewInfo['interviewSlotStatus'],
        } as Data.InterviewSlot
        scheduled = true
      } else {
        if (
          interviewInfo['interviewSlotStatus'] === 'available' &&
          new Date(interviewInfo['date'].seconds * 1000) > new Date()
        ) {
          valuesJson.push({
            ...interviewInfo,
            id: doc.id,
            date: formatDate(new Date(interviewInfo['date'].seconds * 1000)),
          } as Data.InterviewSlot)
        }
      }
    })
    // Sort by date
    valuesJson.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
    return valuesJson
  }
</script>

<div class="ps-4">
  {#if loading}
    <Loading />
  {:else}
    {#await data then value}
      <Card class="my-2 grid gap-3">
        {#if scheduled === false}
          <h2 class="font-bold">Available Interview Slots</h2>

          <Form
            class={clsx('max-w-2xl', showValidation && 'show-validation')}
            on:submit={handleSubmit}
          >
            {#if value.length === 0}
              <div
                class="rounded-md bg-red-100 px-4 py-2 text-red-900 shadow-sm"
              >
                There are no interview slots available at this time. Please
                email us at <Link href="mailto:contact@gbstem.org ">
                  contact@gbstem.org
                </Link> and we will try to find a time that works for you.
              </div>
            {:else}
              <div>
                Please sign up for one of the following interview slots. If none
                of them work for you, please email us at <Link
                  href="mailto:contact@gbstem.org "
                >
                  contact@gbstem.org
                </Link> and we will try to find a time that works for you.
              </div>
            {/if}
            <div class="mb-4">
              <div class="grid grid-cols-2 gap-2">
                {#each value as val}
                  <label>
                    <input
                      type="radio"
                      bind:group={scheduledInterview}
                      value={val}
                    />
                    {val.date} ({val.interviewerName})
                  </label>
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
            <p>
              Your interview will be on {scheduledInterview.date} Eastern Time with
              {scheduledInterview.interviewerName}.
            </p>
            <p>
              Your interview meeting link is <Link
                href={scheduledInterview.meetingLink}
                target="_blank"
                rel="noopener">{scheduledInterview.meetingLink}</Link
              >.
            </p>

            <p>Please check your inbox for an email with interview details.</p>
          </div>
        {:else}
          <div
            class="rounded-md bg-green-100 px-4 py-2 text-center text-green-900 shadow-sm"
          >
            Your interview was on {scheduledInterview.date} Eastern Time.
          </div>
        {/if}
      </Card>
    {/await}
  {/if}
</div>
