import { createApp, ref, onMounted } from "https://esm.sh/vue@3/dist/vue.esm-browser.prod.js";
import JSON5 from "https://esm.sh/json5";

const App = {
  template: `
    <div>
      <div v-if="loading">Loading...</div>
      <div v-else-if="data.error">{{ data.error }}</div>
      <pre v-else>{{ data }}</pre>
    </div>
  `,
  setup() {
    const data = ref(null);
    const loading = ref(true);

    const getHandleFromHash = () => {
      // Remove leading # or #/ from URL hash
      const hash = window.location.hash.replace(/^#\/?/, "");
      return hash || "icecreamsongs"; // default handle
    };

    const fetchData = async () => {
      loading.value = true;
      const handle = getHandleFromHash();
      console.log("Fetching handle:", handle);

      try {
        const res = await fetch(
          `https://pub-4bd66ff117d84987831d9e3b6315de06.r2.dev/${handle}.json5`
        );
        const text = await res.text();
        data.value = JSON5.parse(text);
      } catch (err) {
        console.error(err);
        data.value = { error: `Could not fetch data for "${handle}"` };
      }

      loading.value = false;
    };

    onMounted(() => {
      fetchData();

      // Listen to hash changes for live updates
      window.addEventListener("hashchange", fetchData);
    });

    return { data, loading };
  }
};

createApp(App).mount("#app");
