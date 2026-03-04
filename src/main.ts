import { runEntrypoint } from '@companion-module/base'
import UpgradeScripts from './upgrades.js'
import { AHMInstance } from './instance.js'

runEntrypoint(AHMInstance as any, UpgradeScripts as any)
