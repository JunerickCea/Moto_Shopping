<template>
    <v-container class="px-2 px-sm-4">
        <v-card class="bg-gray-600 text-white pa-4 pa-sm-6 mt-5">
            <h2 class="text-lg font-semibold mb-1"><v-icon class="mr-2">mdi-store-marker</v-icon>Shop details</h2>
            <p class="text-sm text-gray-300 mb-4">Shown to every visitor on the dashboard, together with a Google Map
                of the address.</p>

            <v-alert v-if="message" :type="messageType" variant="tonal" density="compact" class="mb-4"
                :text="message" />

            <v-form ref="form" @submit.prevent="save">
                <v-row dense>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="info.name" label="Shop name" variant="outlined" density="compact"
                            prepend-inner-icon="mdi-store" counter="100" maxlength="100"
                            :rules="[(v) => !!(v || '').trim() || 'Shop name is required']" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="info.contactNo" label="Contact number" variant="outlined"
                            density="compact" prepend-inner-icon="mdi-phone" counter="30" maxlength="30"
                            inputmode="tel" />
                    </v-col>
                    <v-col cols="12">
                        <v-text-field v-model="info.address" label="Full address (used for the map)"
                            variant="outlined" density="compact" prepend-inner-icon="mdi-map-marker" counter="300"
                            maxlength="300" hint="e.g. 123 Rizal Avenue, Santa Cruz, Manila, Philippines"
                            persistent-hint />
                    </v-col>
                    <v-col cols="12">
                        <v-text-field v-model="info.openingHours" label="Opening hours" variant="outlined"
                            density="compact" prepend-inner-icon="mdi-clock-outline" counter="100" maxlength="100"
                            placeholder="Mon–Sat, 9:00 AM – 6:00 PM" />
                    </v-col>
                </v-row>
                <div class="d-flex mt-2">
                    <v-spacer />
                    <v-btn type="submit" color="primary" variant="elevated" prepend-icon="mdi-content-save"
                        :loading="saving">Save</v-btn>
                </div>
            </v-form>
        </v-card>

        <h3 class="text-white text-lg font-semibold mt-6 mb-2">Preview</h3>
        <ShopLocation :info="preview" />
    </v-container>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import api, { errorMessage } from '../../services/api';
import ShopLocation from '../Dashboard/ShopLocation.vue';

const info = ref({ name: '', address: '', contactNo: '', openingHours: '' });
// The map preview updates shortly after typing stops, not on every keystroke.
const preview = ref({ ...info.value });
const form = ref(null);
const saving = ref(false);
const message = ref('');
const messageType = ref('success');

let previewTimer;
watch(info, (value) => {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
        preview.value = { ...value };
    }, 600);
}, { deep: true });

async function save() {
    const { valid } = await form.value.validate();
    if (!valid) return;
    saving.value = true;
    message.value = '';
    try {
        info.value = (await api.put('/shop', info.value)).data;
        preview.value = { ...info.value };
        messageType.value = 'success';
        message.value = 'Shop details saved. The dashboard map now shows this address.';
    } catch (err) {
        messageType.value = 'error';
        message.value = errorMessage(err);
    } finally {
        saving.value = false;
    }
}

onMounted(async () => {
    try {
        info.value = (await api.get('/shop')).data;
        preview.value = { ...info.value };
    } catch (err) {
        messageType.value = 'error';
        message.value = errorMessage(err);
    }
});
</script>
