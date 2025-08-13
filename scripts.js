import {
  createApp,
  ref,
  onMounted
} from "https://esm.sh/vue@3/dist/vue.esm-browser.prod.js";
import { createRouter, createWebHashHistory, useRoute } from "https://esm.sh/vue-router@4/dist/vue-router.esm-browser.prod.js";
import JSON5 from "https://esm.sh/json5";

const PersonView = {
  template: `
    <div v-if="loading">Loading...</div>
    <pre v-else>{{ data }}</pre>
  `,
  setup() {
    const route = useRoute();
    const data = ref(null);
    const loading = ref(true);

    onMounted(async () => {
      const handle = route.params.handle || "icecreamsongs";

      try {
        const res = await fetch(
          `https://pub-4bd66ff117d84987831d9e3b6315de06.r2.dev/${handle}.json5`
        );
        const text = await res.text();
        data.value = JSON5.parse(text);
      } catch (err) {
        data.value = { error: `Could not fetch data for "${handle}"` };
      }

      loading.value = false;
    });

    return { data, loading };
  }
};

const routes = [
  { path: "/:handle", component: PersonView },
  { path: "/", redirect: "/icecreamsongs" }
];

// Use hash history instead of web history
const router = createRouter({
  history: createWebHashHistory(),
  routes
});

const app = createApp({});
app.use(router);
app.mount("#app");

console.log(window.location.href);
