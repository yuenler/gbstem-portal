<!-- Create 3 input fields, one for email, one for password, and one for password confirmation. Add a button to submit the form. Use bootstrap-->
<script lang="ts">
  import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification
  } from 'firebase/auth'

  let isLogin = false
  let email = ''
  let password = ''
  let passwordConfirmation = ''
  let showEmailNotVerified = false

  const onSubmit = () => {
    if (isLogin) {
      const auth = getAuth()
      signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
          // Signed in
          const user = userCredential.user
          if (!user.emailVerified) {
            showEmailNotVerified = true
            sendEmailVerification(user)
              .then(() => {})
              .catch(error => {
                const errorCode = error.code
                const errorMessage = error.message
                alert(errorMessage)
              })
          }
        })
        .catch(error => {
          const errorCode = error.code
          const errorMessage = error.message
          alert(errorMessage)
        })
    } else {
      if (password !== passwordConfirmation) {
        alert('Passwords do not match')
        return
      }
      const auth = getAuth()
      createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
          // Signed in
          const user = userCredential.user
          showEmailNotVerified = true
          sendEmailVerification(user)
            .then(() => {})
            .catch(error => {
              const errorCode = error.code
              const errorMessage = error.message
              alert(errorMessage)
            })
        })
        .catch(error => {
          const errorCode = error.code
          const errorMessage = error.message
          alert(errorMessage)
        })
    }
  }
</script>

<div>
  <link
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css"
    rel="stylesheet"
    integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC"
    crossorigin="anonymous"
  />
  <script
    src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"
    integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM"
    crossorigin="anonymous"
  ></script>

  <div class="w-50 mx-auto">
    <div class="mt-5">
      {#if isLogin}
        <h1>Login</h1>
      {:else}
        <h1>Create account</h1>
      {/if}
    </div>

    {#if showEmailNotVerified}
      <div class="alert alert-warning mt-3" role="alert">
        An verification email has been sent to {email}. Please verify your email. Reload this page
        once you have verified your email.
      </div>
    {/if}
    {#if !showEmailNotVerified}
      <form>
        <div class="form-group">
          <label for="email" class="mt-3">Email</label>
          <input type="email" class="form-control" id="email" bind:value={email} />
        </div>
        <div class="form-group">
          <label for="password" class="mt-3">Password</label>
          <input type="password" class="form-control" id="password" bind:value={password} />
        </div>
        {#if !isLogin}
          <div class="form-group">
            <label for="password-confirmation" class="mt-3">Password Confirmation</label>
            <input
              type="password"
              class="form-control"
              id="password-confirmation"
              bind:value={passwordConfirmation}
            />
          </div>
        {/if}
        <button
          type="submit"
          class="btn btn-primary mt-3 mb-3"
          on:click={() => {
            onSubmit()
          }}>Submit</button
        >
      </form>

      {#if isLogin}
        <a
          href="/"
          on:click={() => {
            isLogin = !isLogin
          }}>Don't have an account? Click here to create an account.</a
        >
      {:else}
        <a
          href="/"
          on:click={() => {
            isLogin = !isLogin
          }}>Already have an account? Click here to sign in.</a
        >
      {/if}
    {/if}
  </div>
</div>
