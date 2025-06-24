import { type RouteConfig } from '@react-router/dev/routes'
import { flatRoutes } from '@react-router/fs-routes'

const fsRoutes = await flatRoutes()

export default [...fsRoutes] satisfies RouteConfig
