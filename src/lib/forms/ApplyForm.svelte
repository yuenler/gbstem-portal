<script>
  import { classNames } from '$lib/utils'
  import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
  import { db, user, storage } from '$lib/firebase'
  import Input from '$lib/components/Input.svelte'
  import Select from '$lib/components/Select.svelte'
  import Textarea from '$lib/components/Textarea.svelte'
  import {
    racesEthnicitiesJson,
    gendersJson,
    schoolsJson,
    worldJson,
    shirtSizeJson,
    dietaryRestrictionsJson,
    reasonsJson,
    statesJson
  } from '$lib/data'
  import { alert } from '$lib/stores'
  import { onDestroy, onMount } from 'svelte'
  import Card from '$lib/components/Card.svelte'
  import { templates } from '$lib/mail'
  import Form from '$lib/components/Form.svelte'

  let disabled = true
  let showValidation = false
  let values = {
    personal: {
      email: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      raceEthnicity: '',
      phoneNumber: '',
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    academic: { currentSchool: '', graduationYear: '', major: '' },
    hackathon: {
      shirtSize: '',
      reason: '',
      why: '',
      role: '',
      proud: '',
      firstHackathon: false,
      previouslyParticipated: false,
      resume: {
        url: '',
        name: ''
      },
      dietaryRestrictions: []
    },
    agreements: { codeOfConduct: false, sharing: false, mlhEmails: false, submitting: false },
    meta: {
      hhid: '',
      uid: '',
      submitted: false
    },
    status: {
      accepted: false,
      rejected: false,
      waitlisted: false
    },
    timestamps: {
      created: serverTimestamp(),
      updated: serverTimestamp()
    }
  }
  let resumeFile = {}
  let saveInterval = undefined
  onMount(async () => {
    const applicationDoc = await getDoc(doc($db, 'applications', $user.uid))
    const exists = applicationDoc.exists()
    if (exists) {
      // comment this out when changing what data the application uses
      // i.e., structure of values
      values = applicationDoc.data()
    }
    if (!values.meta.submitted) {
      const profileDoc = await getDoc(doc($db, 'users', $user.uid))
      const profileDocData = profileDoc.data()
      const temp = {
        email: values.personal.email,
        firstName: values.personal.firstName,
        lastName: values.personal.lastName
      }
      values.personal.email = $user.email
      values.personal.firstName = profileDocData.firstName
      values.personal.lastName = profileDocData.lastName
      values.meta.hhid = profileDocData.hhid
      values.meta.uid = $user.uid
      if (exists) {
        if (
          temp.email !== values.personal.email ||
          temp.firstName !== values.personal.firstName ||
          temp.lastName !== values.personal.lastName
        ) {
          handleSave(false)
        }
      } else {
        await handleSave(false)
        const applicationDoc = await getDoc(doc($db, 'applications', $user.uid))
        values = applicationDoc.data()
      }
      disabled = false
      saveInterval = setInterval(() => {
        handleSave(false)
      }, 300000)
    }
  })
  onDestroy(() => {
    clearInterval(saveInterval)
  })
  function modifiedValues() {
    return {
      ...values,
      timestamps: {
        ...values.timestamps,
        updated: serverTimestamp()
      }
    }
  }
  function handleSave(withDisabling) {
    showValidation = false
    if (withDisabling) {
      disabled = true
    }
    return new Promise((resolve, reject) => {
      setDoc(doc($db, 'applications', $user.uid), modifiedValues())
        .then(() => {
          if (withDisabling) {
            disabled = false
          }
          alert.trigger('success', 'Your application was saved.')
          resolve()
        })
        .catch(err => {
          if (withDisabling) {
            disabled = false
          }
          alert.trigger('error', err.code, true)
          reject()
        })
    })
  }
  async function handleSubmit(e) {
    if (e.detail.error.state) {
      showValidation = true
      alert.trigger('error', e.detail.error.message)
    } else {
      showValidation = false
      disabled = true
      storage
        .uploadFile(resumeFile, `resumes/${$user.uid}.pdf`)
        .then(downloadURL => {
          values.hackathon.resume = {
            url: downloadURL,
            name: resumeFile.name
          }
          clearInterval(saveInterval)
          values.meta.submitted = true
          setDoc(doc($db, 'applications', $user.uid), modifiedValues())
            .then(async () => {
              alert.trigger('success', 'Your application has been submitted!')
              const applicationDoc = await getDoc(doc($db, 'applications', $user.uid))
              values = applicationDoc.data()
              window.scrollTo({
                top: 0,
                behavior: 'smooth'
              })
              handleEmail()
            })
            .catch(err => {
              disabled = false
              alert.trigger('error', err.code, true)
            })
        })
        .catch(() => {
          disabled = false
          alert.trigger('error', 'Error uploading resume. Please try again.')
        })
    }
  }
  function handleEmail() {
    return addDoc(collection($db, 'mail'), {
      to: [values.personal.email],
      message: templates.applicationSubmitted({
        firstName: values.personal.firstName,
        lastName: values.personal.lastName
      })
    })
  }
</script>

<Form class={classNames('max-w-lg', showValidation && 'show-validation')} on:submit={handleSubmit}>
  <fieldset class="grid gap-6" {disabled}>
    <div class="grid gap-1">
      <span class="font-bold">Personal</span>
      <Card class="my-2 grid gap-3">
        <div class="rounded-md bg-gray-100 px-3 py-2 shadow-sm">
          {`Name: ${values.personal.firstName} ${values.personal.lastName}`}
        </div>
        <div class="rounded-md bg-gray-100 px-3 py-2 shadow-sm">
          {`Email: ${values.personal.email}`}
        </div>
        <div class="text-sm">
          {#if values.meta.submitted}
            The above name and email was the copy submitted on your application.
          {:else}
            Wrong name or email? Go to your <a class="link" href="/profile">profile</a> to update your
            information.
          {/if}
        </div>
      </Card>
      {#if values.hackathon.resume.url !== ''}
        <a class="mb-2" href={values.hackathon.resume.url} target="_blank" rel="noreferrer">
          <Card class="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="h-6 w-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <span>{`${values.hackathon.resume.name} (resume)`}</span>
          </Card>
        </a>
      {/if}
      <Input
        type="date"
        bind:value={values.personal.dateOfBirth}
        placeholder="Date of birth"
        floating
        required
      />
      <div class="grid gap-1 sm:grid-cols-2 sm:gap-3">
        <Select
          bind:value={values.personal.gender}
          placeholder="Gender"
          options={gendersJson}
          floating
          required
        />
        <Select
          bind:value={values.personal.raceEthnicity}
          name="race"
          autocomplete="race"
          placeholder="Race or ethnicity"
          options={racesEthnicitiesJson}
          floating
          required
        />
      </div>
      <Input
        type="tel"
        bind:value={values.personal.phoneNumber}
        placeholder="Phone number"
        floating
        required
      />
      <Input
        type="text"
        bind:value={values.personal.address}
        placeholder="Address"
        floating
        required
      />
      <div class="grid gap-1 sm:grid-cols-2 sm:gap-3">
        <Input type="text" bind:value={values.personal.city} placeholder="City" floating required />
        <Select
          bind:value={values.personal.state}
          placeholder="State"
          options={statesJson}
          floating
        />
      </div>
      <div class="grid gap-1 sm:grid-cols-2 sm:gap-3">
        <Select
          bind:value={values.personal.country}
          placeholder="Country"
          options={worldJson}
          floating
          required
        />
        <Input
          type="text"
          bind:value={values.personal.zipCode}
          placeholder="Zip code"
          floating
          required
        />
      </div>
    </div>
    <div class="grid gap-1">
      <span class="font-bold">Academic</span>
      <div class="grid gap-1 sm:grid-cols-3 sm:gap-3">
        <div class="sm:col-span-2">
          <Select
            bind:value={values.academic.currentSchool}
            placeholder="Current school"
            options={schoolsJson}
            floating
            required
          />
        </div>
        <Input
          type="number"
          bind:value={values.academic.graduationYear}
          placeholder="Graduation year"
          min={new Date().getFullYear()}
          max={new Date().getFullYear() + 20}
          floating
          required
        />
      </div>
      <Input type="text" bind:value={values.academic.major} placeholder="Major" floating required />
    </div>
    <div class="grid gap-1">
      <span class="font-bold">Hackathon</span>
      <div class="grid grid-cols-2 sm:grid-cols-3">
        <Select
          bind:value={values.hackathon.shirtSize}
          placeholder="Shirt size"
          options={shirtSizeJson}
          floating
          required
        />
      </div>
      <div class="grid grid-cols-1">
        <Input
          type="checkbox"
          bind:value={values.hackathon.firstHackathon}
          placeholder="Will HackHarvard be your first hackathon?"
        />
        <Input
          type="checkbox"
          bind:value={values.hackathon.previouslyParticipated}
          placeholder="Have you previously participated at a HackHarvard hackathon?"
        />
      </div>
      <div class="mt-2">
        <Select
          bind:value={values.hackathon.reason}
          placeholder="How did you learn about HackHarvard?"
          options={reasonsJson}
          floating
          required
        />
      </div>
      <div class="mt-2">
        <Textarea
          bind:value={values.hackathon.why}
          placeholder="Why do you want to attend HackHarvard?"
          required
        />
      </div>
      <div class="mt-2">
        <Textarea
          bind:value={values.hackathon.role}
          placeholder="What do you see as your role on a hackathon team?"
          required
        />
      </div>
      <div class="mt-2">
        <Textarea
          bind:value={values.hackathon.proud}
          placeholder="What's something you've made that you're proud of?"
          required
        />
      </div>
      {#if values.hackathon.resume.url === ''}
        <div class="mt-2">
          <Input
            bind:value={resumeFile}
            type="file"
            placeholder="Upload your resume (max 1 MB; 1 page PDF)"
            maxSize={1 * 1024 * 1024}
            accept={['application/pdf']}
            required
          />
        </div>
      {/if}
    </div>
    <div class="grid gap-1">
      <span class="font-bold">Dietary restrictions</span>
      <div class="grid grid-cols-2">
        {#each dietaryRestrictionsJson as dietaryRestriction}
          <Input
            type="checkbox"
            bind:value={values.hackathon.dietaryRestrictions}
            placeholder={dietaryRestriction.name}
          />
        {/each}
      </div>
    </div>
    <div class="grid gap-1">
      <span class="font-bold">Agreements</span>
      <div class="grid">
        <Input
          type="checkbox"
          bind:value={values.agreements.codeOfConduct}
          placeholder="I have read and agree to the MLH Code of Conduct (https://static.mlh.io/docs/mlh-code-of-conduct.pdf)."
          required
        />

        <Input
          type="checkbox"
          bind:value={values.agreements.sharing}
          placeholder="I authorize you to share my application/registration information with Major League Hacking for event administration, ranking, and MLH administration in-line with the MLH Privacy Policy (https://mlh.io/privacy). I further agree to the terms of both the MLH Contest Terms and Conditions (https://github.com/MLH/mlh-policies/blob/main/contest-terms.md)and the MLH Privacy Policy (https://mlh.io/privacy)"
          required
        />
        <Input
          type="checkbox"
          bind:value={values.agreements.mlhEmails}
          placeholder="I authorize MLH to send me an email where I can further opt into the MLH Hacker, Events, or
        Organizer Newsletters and other communications from MLH."
        />
        <Input
          type="checkbox"
          bind:value={values.agreements.submitting}
          placeholder="I understand submitting means I can no longer make changes to my application. Don't check this box until you are sure that you are ready to submit."
          required
        />
      </div>
    </div>
    <div class={classNames('grid gap-3', !values.meta.submitted && 'grid-cols-2')}>
      {#if values.meta.submitted}
        <div class="rounded-md bg-green-100 px-4 py-2 text-center text-green-900 shadow-sm">
          Application submitted and in review!
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
      {/if}
    </div>
  </fieldset>
</Form>
