<script lang="ts">
    import Link from '$lib/components/Link.svelte'
    import PageLayout from '$lib/components/PageLayout.svelte'
    import Card from '$lib/components/Card.svelte'
    import Button from '$lib/components/Button.svelte'
    import Dialog from '$lib/components/Dialog.svelte'

    type Curriculum = {
        class: string,
        url: string,
        track: string
    }

    let dialogEl: Dialog
    let selectedCurriculum: Curriculum = {
        class: "",
        url: "",
        track: ""
    }

    let tracks: string[] = ["Math", "Science", "Computer Science", "Engineering"]
    let curriculums: Curriculum[] = [
        // {
        //     class: "Math I",
        //     url: "/curriculum/grade1",
        //     track: "Math"
        // },
        {
            class: "Math II",
            url: "https://docs.google.com/document/d/1UKetFu3NuVbf3-Qi7HMI3nzuRR7qJAUYdAi_ZFIND6o",
            track: "Math"
        },
        {
            class: "Math III",
            url: "https://docs.google.com/document/d/1SRex4R5A3J1By2k3EqpSUa_qN3F8DIvkI9CDddt2C_g",
            track: "Math"
        },
        {
            class: "Math IV",
            url: "https://docs.google.com/document/d/1qkYlxOeKNjv-D_bEUfvKzFcMWZBRcfB09N-Vcri_TD4",
            track: "Math"
        },
        {
            class: "Math V",
            url: "https://docs.google.com/document/d/1cxkbg8yGP1h7Rub8Sc-xC67iipxG_GWPaDAxhTZdm5I",
            track: "Math"
        },
        {
            class: "Scratch",
            url: "https://docs.google.com/document/d/1uDu9cKSnt9jRWusmSj17iVAx6b16-L0gZjWhrhqZr_k",
            track: "Computer Science"
        },
        {
            class: "Scratch II",
            url: "https://docs.google.com/document/d/1uDu9cKSnt9jRWusmSj17iVAx6b16-L0gZjWhrhqZr_k",
            track: "Computer Science"
        },
        {
            class: "Python I",
            url: "https://docs.google.com/document/d/1-EYnFZEOT7hG1FMSrGaRwKqg45Ymq1T_HhZWxRYw6KQ",
            track: "Computer Science"
        },
        {
            class: "Python II",
            url: "https://docs.google.com/document/d/1aFjwWeQR2arqT_CXmGOMkBwHjRIcZCkTL0TJFBPFY4k",
            track: "Computer Science"
        },
        {
            class: "Web Development",
            url: "https://docs.google.com/document/d/1Mpw5i_T827dKXpDxZdbLmO263JSpigUZQbDbLDKuPYM",
            track: "Computer Science"
        },
        {
            class: "Engineering I",
            url: "/curriculum/grade1",
            track: "Engineering"
        },
        {
            class: "Engineering II",
            url: "/curriculum/grade1",
            track: "Engineering"
        },
        {
            class: "Engineering III",
            url: "/curriculum/grade1",
            track: "Engineering"
        },
        {
            class: "Environmental Science",
            url: "https://docs.google.com/document/d/1G_uu26Vfh59wUOwwPlyGH4P9SxeofibaPqB7szl-h44",
            track: "Science"
        },
        {
            class: "Physics",
            url: "https://docs.google.com/document/d/1V-DaLpZxVTKHqfAhmZnZ1WkZcp2Haw5z-1xg59aSRnA",
            track: "Science"
        },
    ]

  </script>
  <svelte:head>
    <title>Curriculum</title>
  </svelte:head>
  <PageLayout>
    <svelte:fragment slot="title">{selectedCurriculum.class} Curriculum</svelte:fragment>
    <Dialog bind:this={dialogEl} size="full">
        <svelte:fragment slot="title"><div class="flex items-center justify-between"><div>{selectedCurriculum.class} Curriculum</div><div class="flex gap-4"><Button color='blue' on:click={()=>window.open(selectedCurriculum.url, '_blank')}>View in Docs</Button><Button color='red' on:click={dialogEl.close}>Close</Button></div></div></svelte:fragment>
        <Card slot = "description">
            <iframe title= {selectedCurriculum.class} src={selectedCurriculum.url + '?widget=true&rm=minimal'} width="100%" height="718" frameborder="10" marginheight="0" marginwidth="0">Loading…</iframe>
        </Card>
    </Dialog>
    <div class="w-full max-w-2xl space-y-4">
        {#each tracks as track}
            <Card>
                <h2 class='font-bold'>{track}</h2>
                <div class = 'inline-block mb-4'>
                {#each curriculums.filter(curriculum => curriculum.track === track) as curriculum}
                    <div class = 'mt-2'><Button on:click={() => {selectedCurriculum = curriculum; dialogEl.open()}} color='blue'>View the {curriculum.class} Curriculum</Button></div>
                {/each}
                </div>
            </Card>
        {/each}
    </div>
  </PageLayout>
  