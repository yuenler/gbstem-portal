<script>
  import ApplyForm from '$lib/forms/ApplyForm.svelte'
</script>

<div>
  <ApplyForm />
  <!-- <form class="w-75 mx-auto">
    <div class="row mt-3">
      <div class="col form-group">
        <label for="firstName" class="form-label">First Name</label>
        <input type="text" class="form-control" id="firstName" placeholder="First Name" />
      </div>

      <div class="col form-group">
        <label for="lastName" class="form-label">Last Name</label>
        <input type="text" class="form-control" id="lastName" placeholder="Last Name" />
      </div>
    </div>

    <div class="row mt-3">
      <div class="col form-group">
        <label for="phoneNumber" class="form-label">Phone Number</label>
        <input type="text" class="form-control" id="phoneNumber" placeholder="Phone Number" />
      </div>

      <div class="col form-group">
        <label for="country" class="form-label">Country of residence</label>
        <input type="text" class="form-control" id="country" placeholder="Country of residence" />
      </div>
    </div>

    <div class="form-group mt-3">
      <label for="birthday" class="form-label">Birthday</label>

      <div class="row">
        <div class="col">
          <select class="form-select" aria-label="Default select example">
            <option selected>Month</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>
        <div class="col">
          <input type="text" class="form-control" id="day" placeholder="Day" />
        </div>
        <div class="col">
          <input type="text" class="form-control" id="year" placeholder="Year" />
        </div>
      </div>
    </div>

    <div class="form-group mt-3">
      <label for="firstHackathon" class="form-label mr-3"
        >Will HackHarvard be your first hackathon?</label
      >
      <label class="form-check-label" for="flexRadioDefault1"> Yes </label>
      <input
        class="form-check-input"
        type="radio"
        name="flexRadioDefault"
        id="flexRadioDefault1"
        checked
      />
      <label class="form-check-label" for="flexRadioDefault1"> No </label>
      <input
        class="form-check-input"
        type="radio"
        name="flexRadioDefault"
        id="flexRadioDefault1"
        checked
      />
    </div>

    <div class="form-group mt-3">
      <label for="previousHackHarvard" class="form-label mr-3"
        >Have you participated in a previous HackHarvard hackathon?</label
      >
      <label class="form-check-label" for="flexRadioDefault2"> Yes </label>
      <input
        class="form-check-input"
        type="radio"
        name="flexRadioDefault2"
        id="flexRadioDefault2"
        checked
      />
      <label class="form-check-label" for="flexRadioDefault2"> No </label>
      <input
        class="form-check-input"
        type="radio"
        name="flexRadioDefault2"
        id="flexRadioDefault2"
        checked
      />
    </div>

    <div class="form-group mt-3">
      <label for="inUni" class="form-label mr-3"
        >Will you be enrolled in a university degree program on October 14th, 2022?</label
      >
      <label class="form-check-label" for="flexRadioDefault3"> Yes </label>
      <input
        class="form-check-input"
        type="radio"
        name="flexRadioDefault3"
        id="flexRadioDefault3"
        checked
      />
      <label class="form-check-label" for="flexRadioDefault3"> No </label>
      <input
        class="form-check-input"
        type="radio"
        name="flexRadioDefault3"
        id="flexRadioDefault3"
        checked
      />
    </div>

    <div class="form-group mt-3">
      <label for="affiliatedWithHarvard" class="form-label mr-3"
        >Are you affiliated with Harvard University?</label
      >
      <label class="form-check-label" for="flexRadioDefault3"> Yes </label>
      <input
        class="form-check-input"
        type="radio"
        name="flexRadioDefault4"
        id="flexRadioDefault4"
        checked
      />
      <label class="form-check-label" for="flexRadioDefault3"> No </label>
      <input
        class="form-check-input"
        type="radio"
        name="flexRadioDefault4"
        id="flexRadioDefault4"
        checked
      />
    </div>

    <div class="form-group mt-3">
      <label for="school" class="form-label">Current school you attend?</label>
      <input
        type="text"
        class="form-control"
        id="school"
        placeholder="Current school you attend?"
      />
    </div>

    <div class="form-group mt-3">
      <label for="email" class="form-label">School email</label>
      <input type="text" class="form-control" id="school-email" placeholder="School email" />
    </div>

    <div class="form-group mt-3">
      <label for="major" class="form-label">Major</label>
      <input type="text" class="form-control" id="major" placeholder="Major" />
    </div>

    <div class="form-group mt-3">
      <label for="graduationYear" class="form-label">Graduation Year</label>
      <input type="text" class="form-control" id="graduationYear" placeholder="Graduation Year" />
    </div>

    <div class="form-group mt-3">
      <label for="gender" class="form-label">Gender</label>
      <select class="form-select" aria-label="Default select example">
        <option selected>Gender</option>
        <option value="1">Man</option>
        <option value="2">Woman</option>
        <option value="3">Non-binary</option>
        <option value="4">Prefer to self-describe</option>
        <option value="5">Prefer Not to Answer</option>
      </select>
    </div>

    <div class="form-group mt-3">
      <label for="ethnicity" class="form-label">Ethnicity</label>
      <select class="form-select" aria-label="Default select example">
        <option selected>Ethnicity</option>
        <option value="1">Native American or Alaska Native</option>
        <option value="2">Asian</option>
        <option value="3">Black or African American</option>
        <option value="4">Hispanic or Latino or Spanish Origin of any race</option>
        <option value="5">Native Hawaiian or Other Pacific Islander</option>
        <option value="6">White</option>
        <option value="7">Two or More Races</option>
        <option value="8">Prefer Not to Answer</option>
      </select>
    </div>

    <div class="form-group mt-3">
      <label for="dietary" class="form-label">Do you have any dietary restrictions?</label>
      <select class="form-select" aria-label="Default select example">
        <option selected>Dietary restrictions</option>
        <option value="1">Vegetarian</option>
        <option value="2">Vegan</option>
        <option value="3">Gluten-free</option>
        <option value="4">Nut-free</option>
        <option value="5">Halal</option>
        <option value="6">Kosher</option>
        <option value="7">Dairy-free</option>
        <option value="8">None</option>
        <option value="9">Other</option>
      </select>
    </div>

    <div class="form-group mt-3">
      <label for="size" class="form-label">What is your unisex adult T-shirt size?</label>
      <select class="form-select" aria-label="Default select example">
        <option selected>Size</option>
        <option value="1">XS</option>
        <option value="2">S</option>
        <option value="3">M</option>
        <option value="4">L</option>
        <option value="5">XL</option>
        <option value="6">XXL</option>
      </select>
    </div>

    <div class="form-group mt-3">
      <label for="role" class="form-label">What do you see as your role on a hackathon team?</label>
      <textarea
        rows="5"
        type="text"
        class="form-control"
        id="role"
        placeholder="150 words max..."
      />
    </div>

    <div class="form-group mt-3">
      <label for="proud" class="form-label"
        >What's something you've made that you're proud of?</label
      >
      <textarea
        rows="5"
        type="text"
        class="form-control"
        id="proud"
        placeholder="150 words max..."
      />
    </div>

    <div class="form-group mt-3">
      <label for="why" class="form-label">Why do you want to come to HackHarvard?</label>
      <textarea rows="5" type="text" class="form-control" id="why" placeholder="150 words max..." />
    </div>

    <div class="form-group mt-3">
      <label for="resume" class="form-label">Upload your resume as a pdf. 1 page max.</label>
      <input type="file" class="form-control" id="resume" />
    </div>

    <div class="form-check mt-3">
      <input class="form-check-input" type="checkbox" value="" id="flexCheckDefault" />
      <label class="form-check-label" for="flexCheckDefault">
        I have read and agree to the MLH Code of Conduct
        (https://static.mlh.io/docs/mlh-code-of-conduct.pdf).
      </label>
    </div>

    <div class="form-check mt-3">
      <input class="form-check-input" type="checkbox" value="" id="flexCheckDefault" />
      <label class="form-check-label" for="flexCheckDefault">
        I authorize you to share my application/registration information with Major League Hacking
        for event administration, ranking, and MLH administration in-line with the MLH Privacy
        Policy (https://mlh.io/privacy). I further agree to the terms of both the MLH Contest Terms
        and Conditions (https://github.com/MLH/mlh-policies/blob/main/contest-terms.md)and the MLH
        Privacy Policy (https://mlh.io/privacy).
      </label>
    </div>

    <div class="form-group mt-3">
      <label for="email" class="form-label"
        >I authorize MLH to send me an email where I can further opt into the MLH Hacker, Events, or
        Organizer Newsletters and other communications from MLH.</label
      >
      <label class="form-check-label" for="flexRadioDefault5">Yes </label>

      <input
        class="form-check-input"
        type="radio"
        name="flexRadioDefault5"
        id="flexRadioDefault5"
        checked
      />
      <label class="form-check-label" for="flexRadioDefault3"> No </label>
      <input
        class="form-check-input"
        type="radio"
        name="flexRadioDefault5"
        id="flexRadioDefault5"
        checked
      />
    </div>

    <div class="form-group mt-3">
      <button type="submit" class="btn btn-primary">Save Draft</button>
      <button type="submit" class="btn btn-primary">Submit Application</button>
    </div>
  </form> -->
</div>
