import os from 'os'

export type Family = 'IPv4' | 'IPv6'

export const getIP = (family: Family): string => {
  const ifaces = os.networkInterfaces()

  let internal = family === 'IPv4' ? '0.0.0.0' : '::'

  for (const name in ifaces) {
    for (const iface of ifaces[name]) {
      if (family && iface.family !== family) continue
      if (iface.internal) internal = iface.address
      else return iface.address
    }
  }

  return internal
}
