import {
    createApp,
    ref,
    reactive,
    onMounted,
    nextTick
} from "https://esm.sh/vue@3/dist/vue.esm-browser.prod.js";

import JSON5 from "https://esm.sh/json5";
import QRCodeStyling from "https://esm.sh/qr-code-styling@1.9";
import { loadIcon } from "https://esm.sh/iconify-icon@3/dist/iconify-icon.min.js";
import { getIconCSS } from "https://esm.sh/@iconify/utils";

const isWebKit =
    /AppleWebKit/.test(navigator.userAgent) &&
    !/Chrome\/|Chromium\/|Edg\//.test(navigator.userAgent);

const faceNames = ["front", "right", "back", "left", "top", "bottom"];

const app = {
    setup() {
        const currentRotation = ref("rotateY(0deg)");
        const qrRefs = reactive([]);
        const profileImageRef = ref("");
        const fullName = ref("");
        const handle = ref("");
        const services = ref([]);

        const loading = ref(true);
        const error = ref(null);

        const rotate = (index) => {
            const rotations = [
                "rotateY(0deg)", // front
                "rotateY(-90deg)", // right
                "rotateY(-180deg)", // back
                "rotateY(90deg)", // left
                "rotateX(-90deg)", // top
                "rotateX(90deg)", // bottom
            ];
            currentRotation.value = rotations[index] || "rotateY(0deg)";
        };

        const copy = (text) => navigator.clipboard.writeText(text);

        const getHandleFromHash = () => {
            const hash = window.location.hash.replace(/^#\/?/, "");
            return hash || null; // null if no handle
        };

        const fetchData = async () => {
            loading.value = true;
            error.value = null;

            let profileHandle = getHandleFromHash() || "givinghumans"; // 👈 default handle here
            console.log("Fetching handle:", profileHandle);

            try {
                const res = await fetch(
                    `https://pub-4bd66ff117d84987831d9e3b6315de06.r2.dev/${profileHandle}.json5`
                );
                const text = await res.text();
                const data = JSON5.parse(text);

                // Set profile info
                fullName.value = data.name;
                handle.value = `@${data.handle}`;
                profileImageRef.value = data.photo;

                // Build services array dynamically from `giving`
                const tempServices = [];

                if (data.giving.venmo) {
                    tempServices.push({
                        name: "Venmo",
                        color: "#3d95ce",
                        icon: "grommet-icons:venmo",
                        handle: data.giving.venmo,
                        qrValue: `https://venmo.com/u/${data.giving.venmo}`,
                        link: `https://venmo.com/u/${data.giving.venmo}`,
                    });
                }

                if (data.giving.cashApp) {
                    tempServices.push({
                        name: "Cash App",
                        color: "#00d632",
                        icon: "simple-icons:cashapp",
                        cashtag: data.giving.cashApp,
                        qrValue: `https://cash.app/${data.giving.cashApp}`,
                        link: `https://cash.app/${data.giving.cashApp}`,
                    });
                }

                if (data.giving.paypal) {
                    tempServices.push({
                        name: "PayPal",
                        color: "#003087",
                        icon: "mage:paypal",
                        handle: data.giving.paypal,
                        qrValue: `https://paypal.me/${data.giving.paypal}`,
                        link: `https://paypal.me/${data.giving.paypal}`,
                    });
                }

                if (data.giving.bitcoin) {
                    tempServices.push({
                        name: "Bitcoin",
                        color: "#f7931a",
                        icon: "bxl:bitcoin",
                        address: data.giving.bitcoin,
                        qrValue: data.giving.bitcoin,
                    });
                }

                services.value = tempServices;

                await nextTick(); // make sure DOM + refs are ready

                // Generate QRs
                for (let i = 0; i < services.value.length; i++) {
                    if (!qrRefs[i]) continue; // just in case
                    const service = services.value[i];
                    try {
                        let type, image;

                        if (isWebKit) {
                            //type = "canvas";
                            //image = false;

                            type = "svg";
                            const icon = await loadIcon(service.icon);
                            const css = getIconCSS(icon, { color: "white" });
                            const regex =
                                /background-image:\s*url\(['"](data:image\/svg\+xml,.*?)['"]\);/;
                            const match = css.match(regex);
                            const dataImageUrl = match[1].trim();
                            image = dataImageUrl;


                        } else {
                            type = "svg";
                            const icon = await loadIcon(service.icon);
                            const css = getIconCSS(icon, { color: "white" });
                            const regex =
                                /background-image:\s*url\(['"](data:image\/svg\+xml,.*?)['"]\);/;
                            const match = css.match(regex);
                            const dataImageUrl = match[1].trim();
                            image = dataImageUrl;
                        }

                        const qr = new QRCodeStyling({
                            width: 150,
                            height: 150,
                            type,
                            data: service.qrValue,
                            image,
                            dotsOptions: { color: "#ffffff", type: "dots" },
                            cornersSquareOptions: { type: "dot" },
                            cornersDotOptions: { type: "dot" },
                            backgroundOptions: { color: null },
                            imageOptions: { crossOrigin: "anonymous" },
                        });

                        qr.append(qrRefs[i]);
                    } catch (err) {
                        console.error(`Failed to generate QR for ${service.name}:`, err);
                    }
                }

            } catch (err) {
                console.error(err);
                error.value = `Could not fetch data for "${profileHandle}"`;
            }

            loading.value = false;
        };


        onMounted(() => {
            fetchData();
            // Watch for hash changes
            window.addEventListener("hashchange", fetchData);
        });

        return {
            services,
            faceNames,
            currentRotation,
            rotate,
            copy,
            qrRefs,
            profileImage: profileImageRef,
            fullName,
            handle,
            loading,
            error,
        };
    },
};

createApp(app).mount("#app");