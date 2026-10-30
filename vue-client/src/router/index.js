import { createRouter, createWebHistory } from 'vue-router'
import { useMainStore } from '../stores/mainStore'

const routes = [
	{
		name: 'Home',
		path: '/',
		component: () => import('@/views/Home.vue'),
		meta: { requiresAuth: true }
	},
	{
		name: 'Login',
		path: '/login',
		component: () => import('../components/LoginPage.vue')
	},
	{
		name: 'UsersMaster',
		path: '/usersmaster',
		component: () => import('../components/MasterMaintenance/UsersMaster.vue'),
		meta: { requiresAuth: true, roles: ['Admin'] }
	},
	{
		name: 'MotorShopMaster',
		path: '/motorshopmaster',
		component: () => import('../components/MasterMaintenance/MotorShop.vue'),
		meta: { requiresAuth: true, roles: ['Admin'] }
	},
	{
		name: 'UserMotorcycle',
		path: '/usermotorcycle',
		component: () => import('../components/MasterMaintenance/UserMotorcycle.vue'),
		meta: { requiresAuth: true, roles: ['User', 'Admin'] }
	},
	{
		name: 'MyOrders',
		path: '/myorders',
		component: () => import('../components/MyOrders.vue'),
		meta: { requiresAuth: true, roles: ['User', 'Admin'] }
	},
	{
		path: '/:pathMatch(.*)*',
		redirect: { name: 'Home' }
	}
]

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes
})

router.beforeEach(async (to) => {
	const store = useMainStore()
	if (!store.ready) await store.fetchMe()

	const home = store.isAdmin ? { name: 'MotorShopMaster' } : { name: 'UserMotorcycle' }
	if (to.name === 'Login') return store.isLoggedIn ? home : true
	if (!store.isLoggedIn) return { name: 'Login' }
	if (to.name === 'Home') return home
	if (to.meta.roles && !to.meta.roles.includes(store.user.role)) return home
	return true
})

export default router
