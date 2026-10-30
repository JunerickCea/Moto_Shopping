<template>
    <v-card class="bg-gradient-to-t from-slate-800 via-slate-800 to-black text-white">
        <v-card-title class="flex items-center border-b bg-black text-white">
            <v-icon>mdi-account-group-outline</v-icon>
            <h1 class="ml-2">Users Master</h1>
            <v-chip class="ml-3">{{ users.length }}</v-chip>
        </v-card-title>

        <v-container>
            <v-text-field v-model="search" density="compact" label="Search name or email..." variant="outlined"
                prepend-inner-icon="mdi-magnify" clearable class="mb-2" />

            <v-data-table :headers="headers" :items="users" :search="search" :loading="loading"
                class="bg-gray-600 text-white" no-data-text="No users yet">
                <template v-slot:item.name="{ item }">
                    <div class="d-flex align-center py-2">
                        <v-avatar size="36" color="primary" class="mr-3">
                            <v-img v-if="item.avatarUrl" :src="item.avatarUrl" referrerpolicy="no-referrer" />
                            <span v-else>{{ item.name[0]?.toUpperCase() }}</span>
                        </v-avatar>
                        <div>
                            <div class="font-weight-bold">{{ item.name }}</div>
                            <div v-if="item.id === me.id" class="text-caption">(you)</div>
                        </div>
                    </div>
                </template>
                <template v-slot:item.role="{ item }">
                    <v-select :model-value="item.role" :items="['Admin', 'User']" density="compact"
                        variant="outlined" hide-details style="min-width: 120px"
                        :disabled="item.id === me.id || saving === item.id"
                        @update:model-value="(role) => update(item, { role })" />
                </template>
                <template v-slot:item.methods="{ item }">
                    <v-chip v-if="item.hasPassword" size="small" class="mr-1" prepend-icon="mdi-lock">Password</v-chip>
                    <v-chip v-if="item.hasGoogle" size="small" prepend-icon="mdi-google">Google</v-chip>
                </template>
                <template v-slot:item.isActive="{ item }">
                    <v-switch :model-value="item.isActive" color="success" hide-details density="compact"
                        :label="item.isActive ? 'Active' : 'Disabled'"
                        :disabled="item.id === me.id || saving === item.id"
                        @update:model-value="(isActive) => update(item, { isActive: Boolean(isActive) })" />
                </template>
                <template v-slot:item.lastLoginAt="{ item }">
                    {{ formatDate(item.lastLoginAt) }}
                </template>
            </v-data-table>
        </v-container>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">{{ snackbar.text }}</v-snackbar>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api, { errorMessage } from '../../services/api';
import { useMainStore } from '../../stores/mainStore';

const me = useMainStore().user;

const headers = [
    { title: 'User', value: 'name' },
    { title: 'Email', value: 'email' },
    { title: 'Role', value: 'role', sortable: false },
    { title: 'Sign-in', value: 'methods', sortable: false },
    { title: 'Status', value: 'isActive', sortable: false },
    { title: 'Last login', value: 'lastLoginAt' },
];

const users = ref([]);
const search = ref('');
const loading = ref(false);
const saving = ref(null);
const snackbar = reactive({ show: false, text: '', color: 'success' });

const notify = (text, color = 'success') => Object.assign(snackbar, { show: true, text, color });
const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'Never');

async function load() {
    loading.value = true;
    try {
        users.value = (await api.get('/users')).data;
    } catch (err) {
        notify(errorMessage(err), 'error');
    } finally {
        loading.value = false;
    }
}

async function update(user, changes) {
    saving.value = user.id;
    try {
        const { data } = await api.patch(`/users/${user.id}`, changes);
        Object.assign(user, data);
        notify(`${user.name} updated. They must log in again for changes to apply.`);
    } catch (err) {
        notify(errorMessage(err), 'error');
        await load();
    } finally {
        saving.value = null;
    }
}

onMounted(load);
</script>
