<script lang="ts">
  import clsx from 'clsx'
  import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    type FieldValue,
  } from 'firebase/firestore'
  import Input from '$lib/components/Input.svelte'
  import Select from '$lib/components/Select.svelte'
  import Textarea from '$lib/components/Textarea.svelte'
  import {
    gendersJson,
    schoolsJson,
    shirtSizeJson,
    dietaryRestrictionsJson,
    rolesJson,
    raceJson,
    prolangsJson,
    statesJson,
    worldJson,
    majorJson,
    reasonsJson,
    experienceJson,
    levelOfStudyJson,
  } from '$lib/data'
  import { alert } from '$lib/stores'
  import { onDestroy, onMount } from 'svelte'
  import Card from '$lib/components/Card.svelte'
  import Form from '$lib/components/Form.svelte'
  import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
  import { db, storage, user } from '$lib/client/firebase'

  type ResumeData = {
    url: string
    name: string
  }

  type ApplicationData = {
    personal: {
      email: string
      firstName: string
      lastName: string
      age: string
      gender: string
      race: string[]
      underrepresented: boolean
      phoneNumber: string
      countryOfResidence: string
      shippingAddress: string
      shippingCity: string
      shippingState: string
      shippingCountry: string
      shippingZipCode: string
      dietaryRestrictions: string[]
    }
    academic: {
      enrolled: boolean
      currentSchool: string
      graduationYear: string
      major: string
      affiliated: boolean
      levelOfStudy: string
    }
    hackathon: {
      shirtSize: string
      firstHackathon: boolean
      previouslyParticipated: boolean
      ableToAttend: boolean
      reason: string
    }
    openResponse: {
      roles: string[]
      otherRole: string
      prolangs: string[]
      otherProlang: string
      experience: string
      whyHh: string
      project: string
      predictions: string
      resume: ResumeData
      resumeShare: boolean
    }
    agreements: {
      codeOfConduct: boolean
      sharing: boolean
      mlhEmails: boolean
      submitting: boolean
    }
    meta: {
      hhid: string
      uid: string
      submitted: boolean
    }
    status: {
      accepted: boolean
      rejected: boolean
      waitlisted: boolean
    }
    timestamps: {
      created: FieldValue
      updated: FieldValue
    }
  }

  let disabled = true
  let showValidation = false
  let values: ApplicationData = {
    personal: {
      email: '',
      firstName: '',
      lastName: '',
      age: '',
      gender: '',
      race: [],
      underrepresented: false,
      phoneNumber: '',
      countryOfResidence: '',
      shippingAddress: '',
      shippingCity: '',
      shippingState: '',
      shippingCountry: '',
      shippingZipCode: '',
      dietaryRestrictions: [],
    },
    academic: {
      enrolled: false,
      currentSchool: '',
      graduationYear: '',
      major: '',
      affiliated: false,
      levelOfStudy: '',
    },
    hackathon: {
      shirtSize: '',
      firstHackathon: false,
      previouslyParticipated: false,
      ableToAttend: false,
      reason: '',
    },
    openResponse: {
      roles: [],
      otherRole: '',
      prolangs: [],
      otherProlang: '',
      experience: '',
      whyHh: '',
      project: '',
      predictions: '',
      resume: {
        url: '',
        name: '',
      },
      resumeShare: false,
    },
    agreements: {
      codeOfConduct: false,
      sharing: false,
      mlhEmails: false,
      submitting: false,
    },
    meta: {
      hhid: '',
      uid: '',
      submitted: false,
    },
    status: {
      accepted: false,
      rejected: false,
      waitlisted: false,
    },
    timestamps: {
      created: serverTimestamp(),
      updated: serverTimestamp(),
    },
  }
  let resumeFile: File
  let saveInterval: number
  onMount(() => {
    return user.subscribe((user) => {
      if (user) {
        getDoc(doc(db, 'applications', user.object.uid)).then(
          (applicationDoc) => {
            const applicationExists = applicationDoc.exists()
            if (applicationExists) {
              const applicationData = applicationDoc.data() as ApplicationData
              values = applicationData
              if (
                !values.meta.submitted &&
                (values.personal.email !== user.object.email ||
                  values.personal.firstName !== user.profile.firstName ||
                  values.personal.lastName !== user.profile.lastName)
              ) {
                values.personal.email = user.object.email as string
                values.personal.firstName = user.profile.firstName
                values.personal.lastName = user.profile.lastName
                handleSave()
              }
            } else {
              values.meta.uid = user.object.uid
              values.meta.hhid = user.profile.hhid
              values.personal.email = user.object.email as string
              values.personal.firstName = user.profile.firstName
              values.personal.lastName = user.profile.lastName
              handleSave()
            }
            if (!values.meta.submitted) {
              disabled = false
              saveInterval = window.setInterval(() => {
                handleSave()
              }, 300000)
            }
          },
        )
      }
    })
  })

  onDestroy(() => {
    clearInterval(saveInterval)
  })
  function modifiedValues() {
    return {
      ...values,
      timestamps: {
        ...values.timestamps,
        updated: serverTimestamp(),
      },
    }
  }
  function handleSave(disable: boolean = false) {
    if (!disabled) {
      showValidation = false
      if (disable) {
        disabled = true
      }
      return new Promise<void>((resolve, reject) => {
        if ($user) {
          setDoc(doc(db, 'applications', $user.object.uid), modifiedValues())
            .then(() => {
              if (disable) {
                disabled = false
              }
              alert.trigger('success', 'Your application was saved.')
              resolve()
            })
            .catch((err) => {
              if (disable) {
                disabled = false
              }
              alert.trigger('error', err.code, true)
              reject()
            })
        }
      })
    }
  }
  function uploadFile(file: File, filePath: string) {
    const fileRef = ref(storage, filePath)
    return new Promise((resolve, reject) =>
      uploadBytes(fileRef, file)
        .then(() => {
          getDownloadURL(fileRef).then((url) => {
            resolve(url)
          })
        })
        .catch(reject),
    )
  }
  function handleSubmit(e: CustomEvent<SubmitData>) {
    if ($user) {
      const frozenUser = $user
      if (e.detail.error === null) {
        showValidation = false
        disabled = true
        uploadFile(resumeFile, `resumes/${frozenUser.object.uid}.pdf`)
          .then((downloadURL) => {
            values.openResponse.resume = {
              url: downloadURL as string,
              name: resumeFile.name,
            }
            values.meta.submitted = true
            setDoc(
              doc(db, 'applications', frozenUser.object.uid),
              modifiedValues(),
            )
              .then(() => {
                alert.trigger('success', 'Your application has been submitted!')
                getDoc(doc(db, 'applications', frozenUser.object.uid)).then(
                  (applicationDoc) => {
                    clearInterval(saveInterval)
                    values = applicationDoc.data() as ApplicationData
                    window.scrollTo({
                      top: 0,
                      behavior: 'smooth',
                    })
                    handleEmail()
                  },
                )
              })
              .catch((err) => {
                disabled = false
                alert.trigger('error', err.code, true)
              })
          })
          .catch(() => {
            disabled = false
            alert.trigger('error', 'Error uploading resume. Please try again.')
          })
      } else {
        showValidation = true
        alert.trigger('error', e.detail.error)
      }
    }
  }
  function handleEmail() {
    // return addDoc(collection(db, 'mail'), {
    //   to: [values.personal.email],
    //   message: templates.applicationSubmitted({
    //     firstName: values.personal.firstName,
    //     lastName: values.personal.lastName
    //   })
    // })
  }

  let popupVisible = false;

  // Function to show the popup on hover
  function handleHover() {
    popupVisible = true;
  }

  // Function to hide the popup when not hovering
  function handleHoverEnd() {
    popupVisible = false;
  }

</script>



<Form
  class={clsx('max-w-2xl', showValidation && 'show-validation')}
  on:submit={handleSubmit}
>
<div
  class="relative mb-3"
  on:mouseenter={handleHover}
  on:mouseleave={handleHoverEnd}
>
  <a class="cursor-pointer link" href="#">
    Are you eligible to apply?
  </a>
  {#if popupVisible}
    <div class="popup absolute bg-white border border-gray-300 p-2 rounded shadow-md z-10">
      <p>As long as you are a student at any accredited college or university in the world, are 18 or older, and are currently pursuing an undergraduate degree, you are invited to apply to HackHarvard!</p>
    </div>
  {/if}
</div>
  <fieldset class="grid gap-14" {disabled}>
    <div class="grid gap-4">
      <span class="font-bold text-2xl">Personal</span>
      <Card class="grid gap-3">
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
            Wrong name or email? Go to your <a class="link" href="/profile"
              >profile</a
            > to update your information.
          {/if}
        </div>
      </Card>
      {#if values.openResponse.resume.url !== ''}
        <a
          class="mb-2"
          href={values.openResponse.resume.url}
          target="_blank"
          rel="noreferrer"
        >
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
            <span>{`${values.openResponse.resume.name} (resume)`}</span>
          </Card>
        </a>
      {/if}
      <Input
        class="w-24"
        type="number"
        bind:value={values.personal.age}
        placeholder="How old will you be on October 20th, 2023?"
        min="0"
        max="100"
        required
      />
      <Select
        bind:value={values.personal.gender}
        placeholder="Gender"
        options={gendersJson}
        floating
        required
      />
      <div class="grid gap-1">
        <span>Race / ethnicity (check all that apply)</span>
        <div class="grid grid-cols-2">
          {#each raceJson as race}
            <Input
              type="checkbox"
              bind:value={values.personal.race}
              placeholder={race.name}
            />
          {/each}
        </div>
      </div>
      <Select
        bind:value={values.personal.underrepresented}
        placeholder="Do you identify as part of an underrepresented group in the technology industry?"
        options={[{ name: 'Yes' }, { name: 'No' }, { name: 'Unsure' }]}
        required
      />
      <Input
        type="tel"
        bind:value={values.personal.phoneNumber}
        placeholder="Phone number"
        floating
        required
      />
      <!-- <span class="text-sm">*format as +1 XXX-XXX-XXXX</span> -->
      <Select
        bind:value={values.personal.countryOfResidence}
        placeholder="Country of residence"
        options={worldJson}
        floating
        required
      />
      <Input
        type="text"
        bind:value={values.personal.shippingAddress}
        placeholder="Shipping Address"
        floating
        required
      />
      <div class="grid gap-1 sm:grid-cols-2 sm:gap-3">
        <Input
          type="text"
          bind:value={values.personal.shippingCity}
          placeholder="City"
          floating
          required
        />
        <Select
          bind:value={values.personal.shippingState}
          placeholder="State"
          options={statesJson}
          floating
        />
      </div>
      <div class="grid gap-1 sm:grid-cols-2 sm:gap-3">
        <Select
          bind:value={values.personal.shippingCountry}
          placeholder="Country"
          options={worldJson}
          floating
          required
        />
        <Input
          type="text"
          bind:value={values.personal.shippingZipCode}
          placeholder="Zip code"
          floating
          required
        />
      </div>
      <div class="mt-2 grid gap-1">
        <span> Do you have any dietary restrictions?</span>
        <div class="grid grid-cols-2">
          {#each dietaryRestrictionsJson as dietaryRestriction}
            <Input
              type="checkbox"
              bind:value={values.personal.dietaryRestrictions}
              placeholder={dietaryRestriction.name}
            />
          {/each}
        </div>
      </div>
    </div>
    <div class="grid gap-4">
      <span class="font-bold text-2xl">Academic</span>
      <Select
        bind:value={values.academic.levelOfStudy}
        placeholder="What is your current education level?"
        options={levelOfStudyJson}
        floating
        required
      />
      <Input
        type="checkbox"
        bind:value={values.academic.enrolled}
        placeholder="Will you be pursuing an undergraduate degree program at a university on October 20th, 2023?"
        required
      />
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
      <Select
        bind:value={values.academic.major}
        placeholder="Major / field of study"
        options={majorJson}
        floating
        required
      />
      <Input
        type="checkbox"
        bind:value={values.academic.affiliated}
        placeholder="Are you affiliated with Harvard University? If so, make sure
        your profile uses your Harvard email."
      />
    </div>
    <div class="grid gap-4">
      <span class="font-bold text-2xl">Hackathon</span>
      <div class="grid grid-cols-2 sm:grid-cols-3">
        <Select
          bind:value={values.hackathon.shirtSize}
          placeholder="Shirt size"
          options={shirtSizeJson}
          floating
          required
        />
      </div>
      <Input
        type="checkbox"
        bind:value={values.hackathon.firstHackathon}
        placeholder="Will HackHarvard be your first hackathon?"
      />
      {#if !values.hackathon.firstHackathon}
        <Input
          type="checkbox"
          bind:value={values.hackathon.previouslyParticipated}
          placeholder="Have you previously participated at a HackHarvard hackathon?"
        />
      {/if}
      <Input
        type="checkbox"
        bind:value={values.hackathon.ableToAttend}
        placeholder="HackHarvard is an in-person event. Will you be able to be in Cambridge, MA, United States, considering both the legal requirements for international students and the logistical aspects, on October 20th, 2023?"
        required
      />
      <Select
        bind:value={values.hackathon.reason}
        placeholder="How did you learn about HackHarvard?"
        options={reasonsJson}
        required
      />
    </div>
    <div class="grid gap-4">
      <span class="font-bold text-2xl">Open response</span>
      <div class="grid gap-1">
        <span>
          What roles best fit your capabilities on a hackathon team?<span
            class="text-red-500"
          >
            *
          </span>
        </span>
        <div class="grid grid-cols-2 gap-2">
          {#each rolesJson as role}
            <Input
              type="checkbox"
              bind:value={values.openResponse.roles}
              placeholder={role.name}
            />
          {/each}
        </div>
        {#if values.openResponse.roles.includes('other')}
          <Textarea
            bind:value={values.openResponse.otherRole}
            placeholder="If other, what other roles could you see yourself playing? (200 char limit)"
            required
            rows={1}
            maxlength={200}
          />
        {/if}
      </div>
      <div class="grid gap-1">
        <span>
          Check up to 5 of the programming languages that you feel most
          comfortable in.<span class="text-red-500"> * </span>
        </span>
        <div class="grid grid-cols-2 gap-2">
          {#each prolangsJson as prolang}
            <Input
              type="checkbox"
              bind:value={values.openResponse.prolangs}
              placeholder={prolang.name}
              validations={[
                [
                  values.openResponse.prolangs.length > 5,
                  'Check up to 5 programming languages only.',
                ],
              ]}
              required
            />
          {/each}
        </div>
        {#if values.openResponse.prolangs.includes('other')}
          <Textarea
            bind:value={values.openResponse.otherProlang}
            placeholder="If other, what other programming languages? (200 char limit)"
            required
            rows={1}
            maxlength={200}
          />
        {/if}
      </div>
      <Select
        bind:value={values.openResponse.experience}
        placeholder="How much experience do you have with computer science?"
        options={experienceJson}
        required
      />
      <Textarea
        bind:value={values.openResponse.whyHh}
        placeholder={`Share your goals and aspirations for this event and how you plan to make the most of your HackHarvard experience. What specific areas are you eager to learn more about, and what skills or technologies are you excited to acquire or improve? (500 char limit)`}
        required
        maxlength={500}
      />
      <Textarea
        bind:value={values.openResponse.project}
        placeholder={`HackHarvard is all about sparking creativity and making a positive difference through innovative projects. We'd love to hear about a project you've been part of that embodies this spirit. How did your project bring a touch of magic or create a lasting impact, whether big or small, on the people or community it reached? (500 char limit)`}
        required
        maxlength={500}
      />
      <Textarea
        bind:value={values.openResponse.predictions}
        placeholder={`In line with the theme "Hack to the Future" for HackHarvard 2023, we invite you to unleash your creativity and envision three predictions for the year 2073. Let your imagination soar as you consider how the world may have transformed. Did OpenAI create AGI? Is Taylor Swift’s granddaughter allergic to tree nuts? Does the iPhone 55 have a headphone jack? Are cat videos still funny? Share your captivating predictions with us! (500 char limit)`}
        required
        maxlength={500}
      />
      {#if values.openResponse.resume.url === ''}
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
      <Input
        type="checkbox"
        bind:value={values.openResponse.resumeShare}
        placeholder="If you are accepted to HackHarvard 2023, would you like us to share your resume with our sponsors for potential recruitment opportunities?"
      />
    </div>
    <div class="grid gap-4">
      <span class="font-bold text-2xl">Agreements</span>
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
        placeholder="I authorize MLH to send me occasional emails about relevant events, career opportunities, and community announcements."
      />
      <Input
        type="checkbox"
        bind:value={values.agreements.submitting}
        placeholder="I understand submitting means I can no longer make changes to my application. Don't check this box until you are sure that you are ready to submit."
        required
      />
    </div>
    <div class={clsx('grid gap-3', !values.meta.submitted && 'grid-cols-2')}>
      {#if values.meta.submitted}
        <div
          class="rounded-md bg-green-100 px-4 py-2 text-center text-green-900 shadow-sm"
        >
          Application submitted and in review!
        </div>
      {:else}
        <button
          type="button"
          on:click={() => handleSave(true)}
          class="rounded-md bg-gray-100 px-4 py-2 shadow-sm transition-colors duration-300 hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-500"
        >
          Save draft
        </button>
        <button
          type="submit"
          class="rounded-md bg-blue-100 px-4 py-2 text-blue-900 shadow-sm transition-colors duration-300 hover:bg-blue-200 disabled:bg-blue-200 disabled:text-blue-500"
        >
          Submit
        </button>
      {/if}
    </div>
  </fieldset>
</Form>
