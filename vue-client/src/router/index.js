import { createRouter, createWebHistory } from 'vue-router'
import { useMainStore } from '../stores/mainStore'

const routes = [
	{
		// Public: guests browse here and are asked to log in only when they add to cart or check out.
		name: 'Dashboard',
		path: '/',
		component: () => import('@/views/Home.vue')
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
		name: 'MyOrders',
		path: '/myorders',
		component: () => import('../components/MyOrders.vue'),
		meta: { requiresAuth: true, roles: ['User', 'Admin'] }
	},
	{ path: '/usermotorcycle', redirect: { name: 'Dashboard' } },
	{
		path: '/:pathMatch(.*)*',
		redirect: { name: 'Dashboard' }
	}
]

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
	scrollBehavior: () => ({ top: 0 })
})

router.beforeEach(async (to) => {
	const store = useMainStore()
	if (!store.ready) await store.fetchMe()

	if (to.name === 'Login' && store.isLoggedIn) {
		return store.isAdmin ? { name: 'MotorShopMaster' } : { name: 'Dashboard' }
	}
	if (to.meta.requiresAuth && !store.isLoggedIn) {
		return { name: 'Login', query: { redirect: to.fullPath } }
	}
	if (to.meta.roles && !to.meta.roles.includes(store.user.role)) return { name: 'Dashboard' }
	return true
})

export default router
