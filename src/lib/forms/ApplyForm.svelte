<!-- TODO: also add the following questions to the form:
how did you learn about HackHarvard?
some questions about technical experience and interests to help with grouping people into teams
 -->
<script>
  import { classNames } from '$lib/utils'
  import { doc, setDoc } from 'firebase/firestore'
  import { db, user } from '$lib/firebase'
  import Input from '$lib/components/Input.svelte'
  import Select from '$lib/components/Select.svelte'
  import {
    racesEthnicitiesJson,
    gendersJson,
    schoolsJson,
    worldJson,
    shirtSizeJson,
    dietaryRestrictionsJson
  } from '$lib/data'
  import { createFields, stripFieldSections, isValid } from '$lib/forms'
  import { alert } from '$lib/stores'

  let formEl
  let disabled = false
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
      ...createFields('shirtSize'),
      firstHackathon: false,
      previouslyParticipated: false,
      dietaryRestrictions: []
    },
    agreements: {
      codeOfConduct: false,
      sharing: false
    },
    submitted: false
  }
  $: if ($user) {
    fields.personal.email.value = $user.email
  }
  function handleSave() {
    showValidation = true
    if (isValid(formEl)) {
      disabled = true
      const applicationRef = doc($db, 'applications', $user.uid)
      setDoc(applicationRef, stripFieldSections(fields)).then(() => {
        disabled = false
        showValidation = false
        alert.trigger('success', 'Your application was saved.')
      })
    }
  }
  function handleSubmit() {
    fields.submitted = true
    showValidation = true
    if (isValid(formEl)) {
      disabled = true
      const applicationRef = doc($db, 'applications', $user.uid)
      setDoc(applicationRef, stripFieldSections(fields)).then(() => {
        showValidation = false
        alert.trigger('success', 'Your application was successfully submitted!')
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
      <div class="grid grid-cols-2 gap-3">
        <Input
          type="text"
          bind:field={fields.personal.firstName}
          placeholder="First name"
          floating
          required
        />
        <Input
          type="text"
          bind:field={fields.personal.lastName}
          placeholder="Last name"
          floating
          required
        />
      </div>
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
    </div>
    <div class="grid gap-1">
      <span class="font-bold">Dietary Restrictions</span>
      <div class="grid grid-cols-2">
        {#each dietaryRestrictionsJson as dietaryRestriction}
          <Input
            type="checkbox"
            bind:group={fields.dietaryRestrictions}
            value={dietaryRestriction.name}
            placeholder={dietaryRestriction.name}
          />
        {/each}
      </div>
    </div>
    <div class="grid gap-1">
      <span class="font-bold">Agreements</span>
      <div class="grid grid-cols-1">
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
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <button
        type="button"
        on:click={handleSave}
        class="shadow-sm rounded-md bg-gray-100 px-4 py-2 text-gray-900 hover:bg-gray-200 transition-colors duration-300 disabled:text-gray-500 disabled:bg-gray-200"
        >Save draft</button
      >
      <button
        type="submit"
        class="shadow-sm rounded-md bg-blue-100 px-4 py-2 text-blue-900 hover:bg-blue-200 transition-colors duration-300 disabled:text-blue-500 disabled:bg-blue-200"
        >Submit</button
      >
    </div>
  </fieldset>
</form>
