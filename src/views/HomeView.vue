<script setup>
import { ref, watch, onMounted, onBeforeMount } from "vue";
import { useGlobalStore } from "@/stores/global";
import axios from "axios";

const inputField = ref();
const inputValue = ref();
const wordSuggestions = ref([]);
const foundWord = ref(false);
const notFoundWord = ref(false);
const word = ref("");
const badWord = ref("");
const searching = ref(false);

const store = useGlobalStore();

onBeforeMount(() => {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    // dark mode
    store.darkMode = true;
  }
});

onMounted(() => {
  inputField.value.focus();
  console.log(store.darkMode);

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (event) => {
      store.darkMode = event.matches ? true : false;
    });
});

watch(inputValue, async () => {
  // console.log(inputValue.value);
  await autocomplete();
  if (!inputValue.value) wordSuggestions.value = "";
});

const autocomplete = async (q) => {
  q = inputValue.value;
  if (q.length < 2) return (wordSuggestions.value = []);
  try {
    axios
      .get(`https://predictor.yandex.net/api/v1/predict.json/complete`, {
        params: {
          key: `pdct.1.1.20221018T090636Z.8610e9fc3b6432a3.7635cee869fdb53e305dfd42659169b296941e54`,
          q,
          lang: `en`,
          limit: `3`,
        },
      })
      .then((res) => {
        if (!res.data.text.length) return;
        wordSuggestions.value = res.data.text;
        console.log(wordSuggestions.value);
      });
  } catch (error) {
    console.log(error);
  }
};

const getWord = async () => {
  badWord.value = inputValue.value;
  try {
    searching.value = true;
    const res = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${inputValue.value}`
    );
    searching.value = false;
    foundWord.value = false;
    notFoundWord.value = false;
    if (!word.value) {
      console.log(res.data[0]);
      word.value = res.data[0];
      foundWord.value = true;
      return;
    }
    setTimeout(() => {
      console.log(res.data[0]);
      word.value = res.data[0];
      foundWord.value = true;
    }, 400);
  } catch (err) {
    searching.value = false;
    console.log(err.response.status);
    if (err.response.status == 404) {
      console.log(`Couldn't find the word "${inputValue.value}"`);
      notFoundWord.value = true;
      foundWord.value = false;
    }
  }
};

const handleTTS = (event) => {
  const audioSource = event.currentTarget.getAttribute("data-audio");
  console.log(audioSource);
  const audio = new Audio(audioSource);
  audio.play();
};

const handleSuggestion = (event) => {
  console.log(event.target.id);
  const suggestion = event.target.id;
  inputValue.value = suggestion;
  getWord();
};

const removeChar = () => {
  inputValue.value = "";
  wordSuggestions.value = [];
};

const handleSearch = async (event) => {
  event.preventDefault();

  if (!inputValue.value) return;

  await getWord();
};

const handleNewWord = (event) => {
  event.preventDefault();
  foundWord.value = false;
  notFoundWord.value = false;
};

const focusInput = () => {
  inputField.value.focus();
};
</script>

<template>
  <main :class="{ dark: store.darkMode }">
    <!-- <div
      @click="store.darkMode = !store.darkMode"
      :class="{ themeButton: true, dark: store.darkMode }"
    >
      <i v-if="store.darkMode" class="fa-solid fa-lightbulb-on"></i>
      <i v-else class="fa-solid fa-lightbulb-slash"></i>
    </div> -->
    <form @submit="handleSearch">
      <div @click="focusInput" class="search-box">
        <i v-if="!searching" class="fa-light fa-magnifying-glass"></i>
        <input
          v-model="inputValue"
          ref="inputField"
          type="text"
          placeholder="Search word"
        />
        <i
          :style="{ visibility: inputValue ? 'visible' : 'hidden' }"
          @click="removeChar"
          class="fa-light fa-circle-xmark"
        ></i>
      </div>
      <div
        :class="{
          'suggestions-container': true,
          open: wordSuggestions.length,
          dark: store.darkMode,
        }"
      >
        <span
          @click="handleSuggestion"
          tabindex="0"
          v-for="suggestion in wordSuggestions"
          :key="suggestion"
          :id="suggestion"
        >
          <i class="fa-light fa-arrow-right"></i> {{ suggestion }}
        </span>
      </div>
      <div :class="{ 'word-container': true, open: foundWord }">
        <div v-if="word">
          <div class="title-container">
            <h1>{{ word.word }}</h1>
            <div
              v-if="
                word.phonetics.length &&
                (word.phonetics[0]?.audio ||
                  word.phonetics[1]?.audio ||
                  word.phonetics[2]?.audio ||
                  word.phonetics[3]?.audio)
              "
              :data-audio="
                word.phonetics[0]?.audio ||
                word.phonetics[1]?.audio ||
                word.phonetics[2]?.audio ||
                word.phonetics[3]?.audio
              "
              class="tts-button"
              @click="handleTTS"
            >
              <i class="fa-solid fa-volume"></i>
            </div>
          </div>
          <p class="spelling">
            {{
              word.phonetic ||
              word.phonetics[0]?.text ||
              word.phonetics[1]?.text ||
              word.phonetics[2]?.text ||
              "N/A"
            }}
          </p>
          <p>
            <i
              ><span style="opacity: 70%">{{
                word.meanings[0].partOfSpeech
              }}</span></i
            >
            <br />
            <br />
            <span
              v-for="(
                wordDefinition, index
              ) in word.meanings[0].definitions.slice(0, 3)"
              :key="wordDefinition.definition"
              >{{ `${index + 1}. ${wordDefinition.definition}` }}<br /><br
            /></span>
          </p>
        </div>
      </div>
      <div :class="{ 'error-container': true, open: notFoundWord }">
        <span>Couldn't find the word: "{{ badWord }}"</span>
      </div>
    </form>
    <button
      @click="handleNewWord"
      v-if="foundWord || notFoundWord"
      class="new-word"
    >
      <i class="fa-regular fa-xmark"></i>
    </button>
  </main>
</template>

<style scoped lang="scss">
div.themeButton {
  position: absolute;
  top: 50px;
  right: 50px;
  width: 50px;
  height: 50px;
  color: white;
  background-color: rgba(0, 0, 0, 0.555);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.1em;
  border-radius: 10px;
  transition: 0.2s ease-in-out;

  & i {
    margin-top: 2px;
  }

  &:hover {
    cursor: pointer;
    background-color: rgb(0, 0, 0);
  }

  &.dark {
    color: black;
    background-color: rgba(255, 255, 255, 0.568);

    &:hover {
      background-color: white;
    }
  }
}

main {
  box-sizing: border-box;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 10px;
  transition: background-color 0.2s ease-in-out;
  padding: 20px 0;

  &.dark {
    background-color: #3f4155;
  }

  // @media only screen and (max-height: 750px) {
  //   scale: 0.8;
  //   margin-top: -10vh;
  //   height: 120vh;
  // }

  & div.error-container {
    background-image: linear-gradient(
      to right top,
      #ed7c90,
      #ed7288,
      #ec6881,
      #eb5d79,
      #ea5271
    );
    border-radius: 10px;
    width: 100%;
    max-width: 340px;
    color: white;
    font-size: 1.1em;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: #ed7c917e 0px 8px 24px;
    height: 0;
    overflow: hidden;
    transition: height 0.2s ease-in-out;

    &.open {
      margin-top: 20px;
      height: 100px;
    }
  }
  & div.suggestions-container {
    height: 0;
    transition: height 0.2s ease-in-out, background-color 0.2s ease-in-out;
    overflow: hidden;
    max-width: 300px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background-color: white;
    font-size: 1.1em;
    padding: 0px 20px;

    &.dark {
      background-color: rgba(56, 44, 56, 0.336);
      color: white;
    }

    &.open {
      padding: 20px;
      border-bottom: 2px solid rgba(128, 128, 128, 0.61);
      height: 100px;
      margin-top: 20px;
      & i {
        opacity: 50%;
      }

      & span {
        // width: fit-content;
        padding: 5px 5px;
        border-radius: 8px;

        &:hover {
          cursor: pointer;
          background-color: rgba(0, 0, 0, 0.068);
        }

        &:last-of-type {
          margin-bottom: 0;
        }
      }
    }
  }
  & div.word-container {
    box-sizing: border-box;
    background-image: linear-gradient(
      to right top,
      #191c61,
      #161a58,
      #13174e,
      #101545,
      #0e123c
    );
    max-height: 0;
    width: 100%;
    max-width: 340px;
    border-radius: 10px;
    transition: max-height 0.4s ease-in-out;
    overflow: hidden;
    color: white;
    padding: 0 30px;
    box-shadow: rgba(0, 15, 99, 0.219) 0px 8px 24px;

    &.open {
      margin-top: 20px;
      // display: initial;
      max-height: 600px;
    }

    & div.title-container {
      margin-top: 30px;
      display: flex;
      // align-items: center;
      justify-content: space-between;
      & div.tts-button {
        background-image: linear-gradient(
          to right top,
          #ed7c90,
          #ed7288,
          #ec6881,
          #eb5d79,
          #ea5271
        );
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.3em;
        border-radius: 8px;
        transition: box-shadow 0.2s ease-in-out;

        &:hover {
          cursor: pointer;
          box-shadow: #ed7c917e 0px 8px 24px;
        }

        & i {
          margin-top: 2px;
        }
      }

      & h1 {
        margin-top: -10px;
        margin-bottom: 0px;
      }
    }

    & p.spelling {
      margin-bottom: 25px;
      color: #df6f89;
    }
  }

  & button.new-word {
    all: unset;
    background-image: linear-gradient(
      to right top,
      #ed7c90,
      #ed7288,
      #ec6881,
      #eb5d79,
      #ea5271
    );
    color: white;
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5em;
    border-radius: 8px;
    margin-top: 20px;
    box-shadow: #ed7c917e 0px 8px 24px;

    transition: all 0.2s ease-in-out;

    &:hover {
      cursor: pointer;
      box-shadow: initial;
    }
  }

  & div.search-box {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    background-color: rgba(255, 255, 255, 0.473);
    padding: 20px;
    width: 100%;
    max-width: 340px;
    border-radius: 10px;
    box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
    // border: 2px solid rgba(0, 0, 0, 0);
    // border-top: 2px solid rgba(255, 255, 255, 0);
    border-bottom: 2px solid rgba(128, 128, 128, 0);
    transition: border-color 0.2s ease-in-out, background-color 0.2s ease-in-out;

    & input {
      padding-top: 6px;
      border: none;
      background-color: rgba(255, 255, 255, 0);
      width: 100%;
      height: 100%;
      outline: none;
      font-size: 1.1em;
      color: rgb(0, 0, 0);
      &::placeholder {
        opacity: 60%;
      }
    }

    & i {
      margin-top: 1px;
      font-size: 2em;
      opacity: 60%;

      &:first-of-type {
        margin-right: 15px;
      }

      &:last-of-type {
        margin-left: 15px;
        transition: color 0.2s ease-in-out;
        &:hover {
          cursor: pointer;
          color: red;
        }
      }
    }

    &:focus-within {
      border-bottom: 2px solid rgba(128, 128, 128, 0.61);
      background-color: white;
      box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
    }

    &:hover {
      cursor: text;
    }
  }
}
</style>
