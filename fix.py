import sys

file_path = 'src/routes/business-dashboard.jsx'
with open(file_path, 'r') as f:
    lines = f.readlines()

# Look for the broken section around lines 46-64
# We want to insert the missing useQuery start

new_lines = []
skip = False
for i, line in enumerate(lines):
    if i + 1 == 56: # Line 56 is is_wheelchair_accessible: false,
        new_lines.append(line)
        new_lines.append('    });\n')
        new_lines.append('\n')
        new_lines.append('    const profilesQuery = useQuery({\n')
        new_lines.append('      queryKey: ["business-dashboard", "profiles"],\n')
        new_lines.append('      queryFn: async () => {\n')
        new_lines.append('        try {\n')
        skip = True # skip the next line which is "});" wrongly placed
    elif i + 1 == 57:
        if "});" in line:
             continue # skip this line
        else:
             new_lines.append(line)
    else:
        new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)
