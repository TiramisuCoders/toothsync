"use client"

import { sidebarMenuConfig, UserRole } from "./sidebar-config"
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./Sidebar"

type Props = {
  role: UserRole
}

export const RoleBasedSidebar = ({ role }: Props) => {
  const menus = sidebarMenuConfig[role]

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarMenu>
          {menus.map((item, index) => (
            <SidebarMenuItem key={index}>
              <SidebarMenuButton asChild>
                <a href={item.href}>{item.label}</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
