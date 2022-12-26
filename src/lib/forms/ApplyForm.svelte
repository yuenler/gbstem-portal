<script>
  import Input from '$lib/components/Input.svelte'
  import Select from '$lib/components/Select.svelte'
  import {
    ethnicitiesJson,
    gendersJson,
    schoolsJson,
    worldJson,
    shirtSizeJson,
    dietaryRestrictionsJson
  } from '$lib/data/index.js'

  let values = {
    personal: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      ethnicity: '',
      phoneNumber: '',
      countryOfResidence: ''
    },
    academic: {
      currentSchool: '',
      graduationYear: '',
      major: ''
    },
    hackathon: {
      firstHackathon: false,
      previouslyParticipated: false,
      shirtSize: '',
      dietaryRestrictions: []
    },
    agreements: {
      codeOfConduct: false,
      sharing: false
    }
  }
</script>

<form class="max-w-lg grid gap-6">
  <div class="grid gap-1">
    <span class="font-bold">Personal</span>
    <div class="grid grid-cols-2 gap-3">
      <Input type="text" bind:value={values.personal.firstName} placeholder="First name" floating />
      <Input type="text" bind:value={values.personal.lastName} placeholder="Last name" floating />
    </div>
    <Input
      type="datetime-local"
      bind:value={values.personal.dateOfBirth}
      placeholder="Date of birth"
      floating
    />
    <div class="grid grid-cols-2 gap-3">
      <Select
        bind:value={values.personal.gender}
        placeholder="Gender"
        sourceJson={gendersJson}
        floating
      />
      <Select
        bind:value={values.personal.ethnicity}
        placeholder="Ethnicity"
        sourceJson={ethnicitiesJson}
        floating
      />
    </div>
    <Input
      type="tel"
      bind:value={values.personal.phoneNumber}
      maskOptions={{
        mask: /^\d*$/
      }}
      placeholder="Phone number"
    />
    <Select
      bind:value={values.personal.countryOfResidence}
      placeholder="Country of residence"
      sourceJson={worldJson}
      floating
    />
  </div>
  <div class="grid gap-1">
    <span class="font-bold">Academic</span>
    <div class="grid grid-cols-3 gap-3">
      <div class="col-span-2">
        <Select
          bind:value={values.academic.currentSchool}
          placeholder="Current school"
          sourceJson={schoolsJson}
          floating
        />
      </div>
      <Input
        type="text"
        bind:value={values.academic.graduationYear}
        placeholder="Graduation year"
        maskOptions={{
          mask: '{2\\0}#0',
          definitions: {
            '#': /^[2-9]$/
          }
        }}
        floating
      />
    </div>
    <Input type="text" bind:value={values.academic.major} placeholder="Major" floating />
  </div>
  <div class="grid gap-1">
    <span class="font-bold">Hackathon</span>
    <div class="grid grid-cols-3">
      <Select
        bind:value={values.hackathon.shirtSize}
        placeholder="Shirt size"
        sourceJson={shirtSizeJson}
        floating
      />
    </div>
    <div class="grid grid-cols-1">
      <Input
        type="checkbox"
        bind:checked={values.hackathon.firstHackathon}
        placeholder="Will HackHarvard be your first hackathon?"
      />
      <Input
        type="checkbox"
        bind:checked={values.hackathon.previouslyParticipated}
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
          bind:group={values.dietaryRestrictions}
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
        bind:checked={values.agreements.codeOfConduct}
        placeholder="I have read and agree to the MLH Code of Conduct (https://static.mlh.io/docs/mlh-code-of-conduct.pdf)."
      />
      <Input
        type="checkbox"
        bind:checked={values.agreements.sharing}
        placeholder="I authorize you to share my application/registration information with Major League Hacking for event administration, ranking, and MLH administration in-line with the MLH Privacy Policy (https://mlh.io/privacy). I further agree to the terms of both the MLH Contest Terms and Conditions (https://github.com/MLH/mlh-policies/blob/main/contest-terms.md)and the MLH Privacy Policy (https://mlh.io/privacy)"
      />
    </div>
  </div>
</form>
