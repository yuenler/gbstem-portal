<script lang="ts">
  import PageLayout from '$lib/components/PageLayout.svelte'
  import ApplyForm from '$lib/components/forms/ApplyForm.svelte'
  import { db, user } from '$lib/client/firebase'
  import RegistrationForm from '$lib/components/forms/RegistrationForm.svelte'
  import Button from '$lib/components/Button.svelte'
  import Select from '$lib/components/Select.svelte'
  import { getDoc, doc } from 'firebase/firestore'
  import { onMount } from 'svelte'
  import { alert } from '$lib/stores'
    import { registrationsCollection } from '$lib/data/constants'

  // if this is a registration, iterate through the user's uid and check if uid-1, uid-2, etc. exists
  // if it does, add it to the options array
  // if it doesn't, break out of the loop

  let options: { name: string }[] = []
  const nameToUid: Record<string, string> = {}
  let value = ''
  let ready = false
  let uid = ''

  const fetchData = async (user: Data.User.Store) => {
    uid = user.object.uid
    for (let i = 1; i < 6; ++i) {
      const docRef = await getDoc(
        doc(db, registrationsCollection, `${uid}-${i}`),
      )
      if (docRef.exists()) {
        const name =
          `${docRef.data().personal.studentFirstName} ${
            docRef.data().personal.studentLastName
          }`.trim() || `Child ${i}`
        options.push({
          name,
        })
        nameToUid[name] = `${uid}-${i}`
      } else {
        break
      }
    }
    if (options.length === 0) {
      options.push({
        name: `Child 1`,
      })
      nameToUid[`Child 1`] = `${uid}-1`
    }
    // set the selected student to the first student
    value = options[0].name
    ready = true
  }

  const addChild = () => {
    if (options.length >= 5) {
      alert.trigger('error', 'You can only register up to 5 children')
      return
    }
    const newChildNumber = options.length + 1
    const newChildName = `Child ${newChildNumber}`

    // Update options array
    options = [...options, { name: newChildName }]
    nameToUid[newChildName] = `${uid}-${newChildNumber}`

    // Set the new child as the selected value
    value = newChildName
  }

  onMount(() => {
    return user.subscribe((user) => {
      if (user && user.profile.role === 'student') {
        fetchData(user)
      }
    })
  })
</script>

<svelte:head>
  <title>Apply</title>
</svelte:head>

{#if $user?.profile.role === 'instructor'}
  <PageLayout>
    <svelte:fragment slot="title">Apply</svelte:fragment>
    <ApplyForm />
  </PageLayout>
{:else}
  <PageLayout>
    <svelte:fragment slot="title">Register</svelte:fragment>
    {#if ready}
      <div class="grid gap-1 sm:grid-cols-3 sm:gap-3">
        <div class="sm:col-span-2">
          {#each [options] as optionList (optionList.length)}
            <Select
              bind:value
              class="mr-2 w-full"
              label="Select a child"
              {options}
              floating
            />
          {/each}
        </div>
        <div class="flex justify-end">
          <Button
            on:click={addChild}
            color="blue"
            class="px-2 py-1"
            type="button">Add Child</Button
          >
        </div>
      </div>
    {/if}
    {#if nameToUid[value]}
      <RegistrationForm childUid={nameToUid[value]} />
    {/if}
  </PageLayout>
{/if}
