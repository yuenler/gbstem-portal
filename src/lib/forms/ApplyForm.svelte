<script>
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
  import { createFields } from '$lib/utils'

  let fields = {
    personal: createFields(
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
    }
  }
</script>

<form class="max-w-lg grid gap-6">
  <div class="grid gap-1">
    <span class="font-bold">Personal</span>
    <div class="grid grid-cols-2 gap-3">
      <Input type="text" bind:field={fields.personal.firstName} placeholder="First name" floating />
      <Input type="text" bind:field={fields.personal.lastName} placeholder="Last name" floating />
    </div>
    <Input
      type="date"
      bind:field={fields.personal.dateOfBirth}
      placeholder="Date of birth"
      floating
    />
    <div class="grid grid-cols-2 gap-3">
      <Select
        bind:field={fields.personal.gender}
        placeholder="Gender"
        sourceJson={gendersJson}
        floating
      />
      <Select
        bind:field={fields.personal.raceEthnicity}
        name="race"
        autocomplete="race"
        placeholder="Race or ethnicity"
        sourceJson={racesEthnicitiesJson}
        floating
      />
    </div>
    <Input type="tel" bind:field={fields.personal.phoneNumber} placeholder="Phone number" />
    <Select
      bind:field={fields.personal.countryOfResidence}
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
          bind:field={fields.academic.currentSchool}
          placeholder="Current school"
          sourceJson={schoolsJson}
          floating
        />
      </div>
      <Input
        type="number"
        bind:field={fields.academic.graduationYear}
        placeholder="Graduation year"
        min={new Date().getFullYear()}
        max={new Date().getFullYear() + 20}
        floating
      />
    </div>
    <Input type="text" bind:field={fields.academic.major} placeholder="Major" floating />
  </div>
  <div class="grid gap-1">
    <span class="font-bold">Hackathon</span>
    <div class="grid grid-cols-3">
      <Select
        bind:field={fields.hackathon.shirtSize}
        placeholder="Shirt size"
        sourceJson={shirtSizeJson}
        floating
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
      />
      <Input
        type="checkbox"
        bind:checked={fields.agreements.sharing}
        placeholder="I authorize you to share my application/registration information with Major League Hacking for event administration, ranking, and MLH administration in-line with the MLH Privacy Policy (https://mlh.io/privacy). I further agree to the terms of both the MLH Contest Terms and Conditions (https://github.com/MLH/mlh-policies/blob/main/contest-terms.md)and the MLH Privacy Policy (https://mlh.io/privacy)"
      />
    </div>
  </div>
</form>
