<script>
  import { classNames } from '$lib/utils'
  import { doc, getDoc, setDoc } from 'firebase/firestore'
  import { db, user } from '$lib/firebase'
  import Input from '$lib/components/Input.svelte'
  import Select from '$lib/components/Select.svelte'
  import {
    racesEthnicitiesJson,
    gendersJson,
    schoolsJson,
    worldJson,
    shirtSizeJson,
    dietaryRestrictionsJson,
    reasonsJson
  } from '$lib/data'
  import { createFields, stripFieldSections, isValid, serializeFieldSections } from '$lib/forms'
  import { alert } from '$lib/stores'
  import { onMount } from 'svelte'
  import Card from '$lib/components/Card.svelte'

  let formEl
  let disabled = true
  let showValidation = false
  let fields = {
    personal: createFields(
      'email',
      'firstName',
      'lastName',
      'dateOfBirth',
      'gender',
      'raceEthnicity',
      'phoneNumber',
      'countryOfResidence'
    ),
    academic: createFields('currentSchool', 'graduationYear', 'major'),
    hackathon: {
      ...createFields('shirtSize', 'reason'),
      firstHackathon: false,
      previouslyParticipated: false,
      dietaryRestrictions: []
    },
    agreements: {
      codeOfConduct: false,
      sharing: false,
      submitting: false
    },
    meta: {
      ...createFields('hhid'),
      submitted: false
    },
    status: {
      approved: false,
      rejected: false,
      waitlisted: false
    }
  }
  onMount(async () => {
    const applicationDoc = await getDoc(doc($db, 'applications', $user.uid))
    if (applicationDoc.exists()) {
      // comment this out when changing what data the application uses
      // i.e., structure of fields
      fields = serializeFieldSections(applicationDoc.data())
    }
    const profileDoc = await getDoc(doc($db, 'users', $user.uid))
    const profileDocData = profileDoc.data()
    const temp = {
      email: fields.personal.email.value,
      firstName: fields.personal.firstName.value,
      lastName: fields.personal.lastName.value
    }
    fields.personal.email.value = $user.email
    fields.personal.firstName.value = profileDocData.firstName
    fields.personal.lastName.value = profileDocData.lastName
    fields.meta.hhid.value = profileDocData.hhid
    if (
      temp.email !== fields.personal.email.value ||
      temp.firstName !== fields.personal.firstName.value ||
      temp.lastName !== fields.personal.lastName.value
    ) {
      handleSave(false)
    }
    disabled = false
    if (!fields.meta.submitted) {
      const interval = setInterval(() => {
        if (!fields.meta.submitted) {
          handleSave(false)
        }
      }, 300000)
      return () => clearInterval(interval)
    }
  })
  function handleSave(withDisabling) {
    showValidation = false
    if (withDisabling) {
      disabled = true
    }
    setDoc(doc($db, 'applications', $user.uid), stripFieldSections(fields))
      .then(() => {
        disabled = false
        alert.trigger('success', 'Your application was saved.')
      })
      .catch(err => {
        disabled = false
        alert.trigger('error', err.code)
      })
  }
  function handleSubmit() {
    showValidation = true
    if (isValid(formEl)) {
      disabled = true
      let strippedFieldSections = stripFieldSections(fields)
      strippedFieldSections.meta.submitted = true
      setDoc(doc($db, 'applications', $user.uid), strippedFieldSections)
        .then(() => {
          disabled = false
          showValidation = false
          fields.meta.submitted = true
          alert.trigger('success', 'Your application was submitted!')
        })
        .catch(err => {
          disabled = false
          alert.trigger('error', err.code)
        })
    }
  }
</script>

<form
  class={classNames('max-w-lg', showValidation && 'show-validation')}
  bind:this={formEl}
  on:submit|preventDefault={handleSubmit}
  novalidate
>
  <fieldset class="grid gap-6" {disabled}>
    <div class="grid gap-1">
      <span class="font-bold">Personal</span>
      <Card class=" grid gap-3 my-2">
        <div class="bg-gray-100 shadow-sm rounded-md px-3 py-2">
          {`Name: ${fields.personal.firstName.value} ${fields.personal.lastName.value}`}
        </div>
        <div class="bg-gray-100 shadow-sm rounded-md px-3 py-2">
          {`Email: ${fields.personal.email.value}`}
        </div>
        <div class="text-sm">
          Wrong name or email? Go to your <a class="link" href="/profile">profile</a> to update your
          information.
        </div>
      </Card>
      <Input
        type="date"
        bind:field={fields.personal.dateOfBirth}
        placeholder="Date of birth"
        floating
        required
      />
      <div class="grid sm:grid-cols-2 gap-1 sm:gap-3">
        <Select
          bind:field={fields.personal.gender}
          placeholder="Gender"
          sourceJson={gendersJson}
          floating
          required
        />
        <Select
          bind:field={fields.personal.raceEthnicity}
          name="race"
          autocomplete="race"
          placeholder="Race or ethnicity"
          sourceJson={racesEthnicitiesJson}
          floating
          required
        />
      </div>
      <Input
        type="tel"
        bind:field={fields.personal.phoneNumber}
        placeholder="Phone number"
        floating
        required
      />
      <Select
        bind:field={fields.personal.countryOfResidence}
        placeholder="Country of residence"
        sourceJson={worldJson}
        floating
        required
      />
    </div>
    <div class="grid gap-1">
      <span class="font-bold">Academic</span>
      <div class="grid sm:grid-cols-3 gap-1 sm:gap-3">
        <div class="sm:col-span-2">
          <Select
            bind:field={fields.academic.currentSchool}
            placeholder="Current school"
            sourceJson={schoolsJson}
            floating
            required
          />
        </div>
        <Input
          type="number"
          bind:field={fields.academic.graduationYear}
          placeholder="Graduation year"
          min={new Date().getFullYear()}
          max={new Date().getFullYear() + 20}
          floating
          required
        />
      </div>
      <Input type="text" bind:field={fields.academic.major} placeholder="Major" floating required />
    </div>
    <div class="grid gap-1">
      <span class="font-bold">Hackathon</span>
      <div class="grid grid-cols-2 sm:grid-cols-3">
        <Select
          bind:field={fields.hackathon.shirtSize}
          placeholder="Shirt size"
          sourceJson={shirtSizeJson}
          floating
          required
        />
      </div>
      <div class="grid grid-cols-1">
        <Input
          type="checkbox"
          bind:checked={fields.hackathon.firstHackathon}
          placeholder="Will HackHarvard be your first hackathon?"
        />
        <Input
          type="checkbox"
          bind:checked={fields.hackathon.previouslyParticipated}
          placeholder="Have you previously participated at a HackHarvard hackathon?"
        />
      </div>
      <div class="mt-2">
        <Select
          bind:field={fields.hackathon.reason}
          placeholder="How did you learn about HackHarvard?"
          sourceJson={reasonsJson}
          floating
          required
        />
      </div>
    </div>
    <div class="grid gap-1">
      <span class="font-bold">Dietary restrictions</span>
      <div class="grid grid-cols-2">
        {#each dietaryRestrictionsJson as dietaryRestriction}
          <Input
            type="checkbox"
            bind:group={fields.hackathon.dietaryRestrictions}
            value={dietaryRestriction.name}
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
          bind:checked={fields.agreements.codeOfConduct}
          placeholder="I have read and agree to the MLH Code of Conduct (https://static.mlh.io/docs/mlh-code-of-conduct.pdf)."
          required
        />
        <Input
          type="checkbox"
          bind:checked={fields.agreements.sharing}
          placeholder="I authorize you to share my application/registration information with Major League Hacking for event administration, ranking, and MLH administration in-line with the MLH Privacy Policy (https://mlh.io/privacy). I further agree to the terms of both the MLH Contest Terms and Conditions (https://github.com/MLH/mlh-policies/blob/main/contest-terms.md)and the MLH Privacy Policy (https://mlh.io/privacy)"
          required
        />
        <Input
          type="checkbox"
          bind:checked={fields.agreements.submitting}
          placeholder="I understand submitting means I can no longer make changes to my application. Don't check this box until you are sure that you are ready to submit."
          required
        />
      </div>
    </div>
    <div class={classNames('grid gap-3', !fields.meta.submitted && 'grid-cols-2')}>
      {#if fields.meta.submitted}
        <div class="shadow-sm rounded-md bg-green-100 px-4 py-2 text-green-900 text-center">
          Application submitted and in review!
        </div>
      {:else}
        <button
          type="button"
          on:click={() => handleSave(true)}
          class="shadow-sm rounded-md bg-gray-100 px-4 py-2 text-gray-900 hover:bg-gray-200 transition-colors duration-300 disabled:text-gray-500 disabled:bg-gray-200"
          >Save draft</button
        >
        <button
          type="submit"
          class="shadow-sm rounded-md bg-blue-100 px-4 py-2 text-blue-900 hover:bg-blue-200 transition-colors duration-300 disabled:text-blue-500 disabled:bg-blue-200"
          >Submit</button
        >
      {/if}
    </div>
  </fieldset>
</form>
