<script lang="ts">
import { collection, query, getDocs, deleteDoc, doc, getDoc, setDoc, serverTimestamp,
    Timestamp} from "firebase/firestore";
import { onDestroy, onMount } from 'svelte';
import { db, storage, user } from '$lib/client/firebase';
import Input from '$lib/components/Input.svelte';
import * as fs from 'fs';
import Form from '$lib/components/Form.svelte';
import clsx from 'clsx';
import { alert } from '$lib/stores'
import { cloneDeep } from 'lodash-es'
import Card from "../Card.svelte";

let showValidation = false
let valuesJson:Data.Interview[] = [];
export let interviewJson = {};
let selectedId:string[] = []

let values: Data.Application = {
    personal: {
      email: '',
      firstName: '',
      lastName: '',
      gender: '',
      race: [],
      phoneNumber: '',
      dateOfBirth: '',
    },
    academic: {
      school: '',
      graduationYear: '',
    },
    program: {
      courses: [],
      preferences: '',
      timeSlots: [],
      notAvailable: '',
      inPerson: false,
      numClasses: '',
      reason: '',
    },
    essay: {
      taughtBefore: false,
      academicBackground: '',
      teachingScenario: '',
      why: '',
    },
    agreements: {
      entireProgram: false,
      timeCommitment: false,
      submitting: false,
    },
    meta: {
      id: '',
      uid: '',
      submitted: false,
      scheduled: false,
    },
    timestamps: {
      created: serverTimestamp() as Timestamp,
      updated: serverTimestamp() as Timestamp,
    },
  }

onMount(() => {
    return user.subscribe((user) => {
      if (user) {
        getDoc(doc(db, 'applicationsSpring24', user.object.uid)).then(
          (applicationDoc) => {
            const applicationExists = applicationDoc.exists()
            if (applicationExists) {
              const applicationData = applicationDoc.data() as Data.Application
              values = cloneDeep(applicationData)
            }
        })
    }
})
})

function handleSubmit() {
    console.log(selectedId);
    if(selectedId.length > 1 || selectedId.length == 0) {
        alert.trigger(
            'error',
            'Please select one time',
        )
    } else {
        const interviewerId = selectedId[0];
        console.log(valuesJson)
        valuesJson.forEach((interview) => {
            console.log(interview["id"])
            if(interview.id === interviewerId) {
                console.log("FOUND")
                interviewJson = interview;
                values.meta.scheduled = true;
                setDoc(
          doc(db, 'applicationsSpring24', values.meta.uid),
          modifiedValues(),
        )
          .then(() => {
            alert.trigger('success', 'Your interview has been scheduled!')
            getDoc(doc(db, 'applicationsSpring24', values.meta.uid)).then(
              (applicationDoc) => {
                fetch('/api/interview', {
                  method: 'POST',
                }).then(async (res) => {
                  if (!res.ok) {
                    const { message } = await res.json()
                    console.log(message)
                  }
                  const applicationData =
                    applicationDoc.data() as Data.Application
                  values = cloneDeep(applicationData)
                  console.log
                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                  })
                  })})
            deleteData();
        })
        }})
     
        alert.trigger(
            'success',
            'Thank you for signing up for an interview! You will receive an email with the details shortly.',
        )

    }
}

async function deleteData() {
    await deleteDoc(doc(db, "instructorInterviewTimes", selectedId[0]));
}

function modifiedValues() {
    return {
      ...values,
      timestamps: {
        ...values.timestamps,
        updated: serverTimestamp(),
      },
    }
  }

async function getData() {
 const q = query(collection(db, "instructorInterviewTimes"))
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    const json = doc.data();
    const id = doc.id;
    const date = json["Date"];
    const interviewDate = new Date(date["seconds"] * 1000).toLocaleString();
    valuesJson.push({
        date: interviewDate,
        id: id,
        interviewer:json["Interviewer"],
        interviewerEmail:json["Interviewer Email"],
        link: json["Link"],
    });
    })
    return valuesJson;
}

let data = getData();

</script>
{#await data}
{:then value}
<Card class="my-2 grid gap-3">
{#if values.meta.scheduled}
    <div
    class="rounded-md bg-green-100 px-4 py-2 text-center text-green-900 shadow-sm">
        Interview scheduled! 
    </div>
{:else}
<h2 class="font-bold">Available Interview Slots</h2>
<div>Please sign up for one. If there are no slots available for you, please email contact@gbstem.org and we will try to find a time that works for you.</div>
<Form class={clsx('max-w-2xl', showValidation && 'show-validation')}
on:submit={handleSubmit}>
<div class = "mb-4">
    <div class="grid grid-cols-2 gap-2">
    {#each value as val}
    <Input
     type = "checkbox"
     bind:value = {selectedId}
     label = {val.date}
     name = {val.id}
     floating
     required
    />
    {/each}
    </div>
</div>
<button type="submit"class="rounded-md bg-blue-100 px-4 py-2 text-blue-900 shadow-sm transition-colors duration-300 hover:bg-blue-200 disabled:bg-blue-200 disabled:text-blue-500">Submit</button>
</Form>
{/if}
</Card>
{/await}