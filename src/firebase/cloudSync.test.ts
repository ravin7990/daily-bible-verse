/**
 * Behavioural tests for the two pieces that must never regress: the type codec
 * (a wrong prefix corrupts the phone's data) and the Last-Write-Wins merge
 * (a wrong rule loses edits or resurrects deletions).
 *
 * Run with:  npm test
 */
import { describe, expect, it } from 'vitest'
import { decodePrefs, encodePrefs, mergePrefs } from './syncCodec'

describe('codec: int / long / float discrimination', () => {
  it('tags an in-range integer as __int__', () => {
    expect(encodePrefs({ current_day: 3 })).toEqual({ __int__current_day: 3 })
  })

  it('tags an out-of-range integer as __long__', () => {
    // The real bug: start_time is epoch millis. As __int__ the app's .toInt()
    // overflows and the reading plan lands in 1970.
    expect(encodePrefs({ start_time: 1750000000000 })).toEqual({
      __long__start_time: 1750000000000,
    })
  })

  it('tags a fractional number as __float__', () => {
    expect(encodePrefs({ volume: 0.5 })).toEqual({ __float__volume: 0.5 })
  })

  it('round-trips every numeric type without loss', () => {
    const original = {
      current_day: 3,
      start_time: 1750000000000,
      volume: 0.75,
    }
    expect(decodePrefs(encodePrefs(original))).toEqual(original)
  })

  it('handles booleans and string sets', () => {
    expect(encodePrefs({ darkModeEnabled: true, saved: ['a', 'b'] })).toEqual({
      __bool__darkModeEnabled: true,
      __stringset__saved: ['a', 'b'],
    })
  })

  it('writes strings bare and preserves chapter tokens verbatim', () => {
    expect(encodePrefs({ active_plan_id: 'peace_7', read_chapters_set_KJV: ['42-3'] })).toEqual({
      active_plan_id: 'peace_7',
      __stringset__read_chapters_set_KJV: ['42-3'],
    })
  })
})

describe('merge: Last-Write-Wins per key', () => {
  it('adopts the cloud when the cloud is newer', () => {
    const { values, dirty } = mergePrefs(
      { title: 'old' },
      { title: 'new' },
      { title: 100 },
      { title: 200 },
    )
    expect(values.title).toBe('new')
    expect(dirty).toEqual([])
  })

  it('keeps the local value and marks it dirty when local is newer', () => {
    const { values, dirty } = mergePrefs(
      { title: 'mine' },
      { title: 'theirs' },
      { title: 300 },
      { title: 200 },
    )
    expect(values.title).toBe('mine')
    expect(dirty).toEqual(['title'])
  })

  it('propagates a deletion instead of resurrecting it', () => {
    // The old union merge could never do this: the phone removed "c", but the
    // web's cached union kept re-adding it forever.
    const { values, dirty } = mergePrefs(
      { liked: ['a', 'b', 'c'] },
      { liked: ['a', 'b'] },
      { liked: 100 },
      { liked: 500 },
    )
    expect(values.liked).toEqual(['a', 'b'])
  })

  it('propagates a deletion made on the web', () => {
    const { values } = mergePrefs(
      { liked: ['a', 'b'] },
      { liked: ['a', 'b', 'c'] },
      { liked: 900 },
      { liked: 100 },
    )
    expect(values.liked).toEqual(['a', 'b'])
  })

  it('never lowers a high-water mark, whatever the clocks say', () => {
    const { values } = mergePrefs(
      { max_streak: 30 },
      { max_streak: 12 },
      { max_streak: 100 },
      { max_streak: 900 },
    )
    expect(values.max_streak).toBe(30)
  })

  it('does let a stale cloud clear a position the user reset', () => {
    // The counter-example to "max wins everywhere": leaving a plan must stick.
    const { values } = mergePrefs(
      { active_plan_id: '' },
      { active_plan_id: 'peace_7' },
      { active_plan_id: 400 },
      { active_plan_id: 100 },
    )
    expect(values.active_plan_id).toBe('')
  })

  it('lets the cloud win a tie, so a new device cannot clobber an account', () => {
    const { values, dirty } = mergePrefs(
      { a: 'local' },
      { a: 'cloud' },
      {},
      {},
    )
    expect(values.a).toBe('cloud')
    expect(dirty).toEqual([])
  })

  it('uploads keys the cloud has never seen', () => {
    // Regression guard: a local-only key used to be dropped from `dirty`, so a
    // brand-new bookmark or note would never leave the device at all.
    const { values, dirty } = mergePrefs(
      { mine: 1 },
      { theirs: 2 },
      { mine: 10 },
      { theirs: 10 },
    )
    expect(values).toEqual({ mine: 1, theirs: 2 })
    expect(dirty).toEqual(['mine'])
  })

  it('unions JSON note maps so each side keeps its own entries', () => {
    const { values, dirty } = mergePrefs(
      { personal_verse_notes_map: '{"john_3_16":"mine"}' },
      { personal_verse_notes_map: '{"matt_5_3":"theirs"}' },
      { personal_verse_notes_map: 500 },
      { personal_verse_notes_map: 400 },
    )
    expect(JSON.parse(values.personal_verse_notes_map as string)).toEqual({
      john_3_16: 'mine',
      matt_5_3: 'theirs',
    })
    expect(dirty).toEqual(['personal_verse_notes_map'])
  })

  it('unions the prayer journal by id, keeping one row per prayer', () => {
    const { values } = mergePrefs(
      { personal_prayers_list: '[{"id":"a","title":"A"}]' },
      { personal_prayers_list: '[{"id":"b","title":"B"}]' },
      { personal_prayers_list: 10 },
      { personal_prayers_list: 20 },
    )
    const parsed = JSON.parse(values.personal_prayers_list as string)
    expect(parsed.map((p: { id: string }) => p.id)).toEqual(['b', 'a'])
  })

  it('falls back to Last-Write-Wins when a JSON payload is malformed', () => {
    const { values } = mergePrefs(
      { personal_verse_notes_map: 'not json' },
      { personal_verse_notes_map: '{"a":"b"}' },
      { personal_verse_notes_map: 500 },
      { personal_verse_notes_map: 100 },
    )
    expect(values.personal_verse_notes_map).toBe('not json')
  })
})